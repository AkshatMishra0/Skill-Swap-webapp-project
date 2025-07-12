import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { SwapRequest } from "@/lib/models/User"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const db = await getDatabase()
    const requests = db.collection<SwapRequest>("swapRequests")
    const requestDoc = await requests.findOne({ _id: new ObjectId(id) })
    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }
    return NextResponse.json({ 
      request: { 
        ...requestDoc, 
        id: requestDoc._id?.toString(),
        senderId: requestDoc.senderId?.toString(),
        receiverId: requestDoc.receiverId?.toString(),
        _id: requestDoc._id?.toString()
      } 
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { status } = await request.json()

    if (!["accepted", "rejected", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const db = await getDatabase()
    const requests = db.collection<SwapRequest>("swapRequests")

    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (status === "completed") {
      updateData.completedAt = new Date()
    }

    const result = await requests.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        $or: [{ senderId: new ObjectId(decoded.userId) }, { receiverId: new ObjectId(decoded.userId) }],
      },
      { $set: updateData },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Request not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({
      request: {
        ...result,
        id: result._id?.toString(),
        senderId: result.senderId.toString(),
        receiverId: result.receiverId.toString(),
        _id: undefined,
      },
    })
  } catch (error) {
    console.error("Error updating request:", error)
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const requests = db.collection<SwapRequest>("swapRequests")

    const result = await requests.deleteOne({
      _id: new ObjectId(id),
      senderId: new ObjectId(decoded.userId),
      status: "pending",
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Request not found or cannot be deleted" }, { status: 404 })
    }

    return NextResponse.json({ message: "Request deleted successfully" })
  } catch (error) {
    console.error("Error deleting request:", error)
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 })
  }
}
