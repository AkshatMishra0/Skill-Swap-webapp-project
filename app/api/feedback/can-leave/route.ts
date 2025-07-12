import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ canLeave: false, error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ canLeave: false, error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get("targetId")
    
    if (!targetId) {
      return NextResponse.json({ canLeave: false, error: "Target ID required" }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Check if a completed swap exists between current user and target user
    const swap = await db.collection("swapRequests").findOne({
      $or: [
        { senderId: new ObjectId(decoded.userId), receiverId: new ObjectId(targetId), status: "completed" },
        { senderId: new ObjectId(targetId), receiverId: new ObjectId(decoded.userId), status: "completed" }
      ]
    })

    if (!swap) {
      return NextResponse.json({ 
        canLeave: false, 
        reason: "No completed skill swap found between users" 
      })
    }

    // Check if feedback already exists from current user to target user
    const existingFeedback = await db.collection("feedback").findOne({
      fromUserId: decoded.userId,
      toUserId: targetId
    })

    if (existingFeedback) {
      return NextResponse.json({ 
        canLeave: false, 
        reason: "Feedback already submitted for this user" 
      })
    }

    return NextResponse.json({ 
      canLeave: true, 
      swapId: swap._id?.toString(),
      reason: "Eligible to leave feedback" 
    })
  } catch (error) {
    return NextResponse.json({ canLeave: false, error: "Failed to check feedback eligibility" }, { status: 500 })
  }
}
