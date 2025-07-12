import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { SwapRequest } from "@/lib/models/User"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = new ObjectId(decoded.userId)
    const db = await getDatabase()
    const requests = db.collection<SwapRequest>("swapRequests")
    const users = db.collection("users")

    // Get all requests involving this user
    const userRequests = await requests
      .find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Populate user information
    const populatedRequests = await Promise.all(
      userRequests.map(async (req) => {
        const sender = await users.findOne({ _id: req.senderId }, { projection: { name: 1, avatar: 1 } })
        const receiver = await users.findOne({ _id: req.receiverId }, { projection: { name: 1, avatar: 1 } })

        return {
          ...req,
          id: req._id?.toString(),
          senderId: req.senderId.toString(),
          receiverId: req.receiverId.toString(),
          senderName: sender?.name || "Unknown",
          receiverName: receiver?.name || "Unknown",
          senderAvatar: sender?.avatar,
          receiverAvatar: receiver?.avatar,
          _id: undefined,
        }
      }),
    )

    return NextResponse.json({ requests: populatedRequests })
  } catch (error) {
    console.error("Error fetching requests:", error)
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { receiverId, skillOffered, skillWanted, message } = await request.json()

    if (!receiverId || !skillOffered || !skillWanted) {
      return NextResponse.json({ error: "Receiver ID, skill offered, and skill wanted are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const requests = db.collection<SwapRequest>("swapRequests")

    // Check for existing pending request
    const existingRequest = await requests.findOne({
      senderId: new ObjectId(decoded.userId),
      receiverId: new ObjectId(receiverId),
      status: "pending",
    })

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending request with this user" }, { status: 400 })
    }

    const newRequest: SwapRequest = {
      senderId: new ObjectId(decoded.userId),
      receiverId: new ObjectId(receiverId),
      skillOffered,
      skillWanted,
      message,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await requests.insertOne(newRequest)

    return NextResponse.json({
      request: {
        ...newRequest,
        id: result.insertedId.toString(),
        senderId: decoded.userId,
        receiverId,
        _id: undefined,
      },
    })
  } catch (error) {
    console.error("Error creating request:", error)
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 })
  }
}
