import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken, getUserById } from "@/lib/auth"

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

    const user = await getUserById(decoded.userId)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const db = await getDatabase()
    const requests = db.collection("swapRequests")
    const users = db.collection("users")

    const swapRequests = await requests
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    // Get user details for sender and receiver
    const swapsWithUserDetails = await Promise.all(
      swapRequests.map(async (swap) => {
        const sender = await users.findOne({ _id: swap.senderId })
        const receiver = await users.findOne({ _id: swap.receiverId })

        return {
          ...swap,
          id: swap._id?.toString(),
          _id: undefined,
          senderId: swap.senderId?.toString(),
          receiverId: swap.receiverId?.toString(),
          senderName: sender?.name || "Unknown",
          receiverName: receiver?.name || "Unknown",
        }
      })
    )

    return NextResponse.json({ swaps: swapsWithUserDetails })
  } catch (error) {
    console.error("Error fetching admin swaps:", error)
    return NextResponse.json({ error: "Failed to fetch swaps" }, { status: 500 })
  }
}
