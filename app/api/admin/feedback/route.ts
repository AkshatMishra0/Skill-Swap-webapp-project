import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken, getUserById } from "@/lib/auth"
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

    const user = await getUserById(decoded.userId)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const db = await getDatabase()
    const feedbacks = db.collection("feedback")
    const users = db.collection("users")

    const feedbackList = await feedbacks
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    // Get user details for fromUser and toUser
    const feedbackWithUserDetails = await Promise.all(
      feedbackList.map(async (feedback) => {
        let fromUser = null
        let toUser = null
        
        try {
          // Try to find user by ObjectId first
          if (feedback.fromUserId) {
            if (typeof feedback.fromUserId === 'string') {
              if (ObjectId.isValid(feedback.fromUserId)) {
                fromUser = await users.findOne({ _id: new ObjectId(feedback.fromUserId) })
              }
              if (!fromUser) {
                // Try as string ID
                fromUser = await users.findOne({ _id: feedback.fromUserId } as any)
              }
            } else {
              fromUser = await users.findOne({ _id: feedback.fromUserId })
            }
          }
          
          if (feedback.toUserId) {
            if (typeof feedback.toUserId === 'string') {
              if (ObjectId.isValid(feedback.toUserId)) {
                toUser = await users.findOne({ _id: new ObjectId(feedback.toUserId) })
              }
              if (!toUser) {
                // Try as string ID
                toUser = await users.findOne({ _id: feedback.toUserId } as any)
              }
            } else {
              toUser = await users.findOne({ _id: feedback.toUserId })
            }
          }
        } catch (error) {
          console.error("Error looking up users for feedback:", error)
        }

        return {
          ...feedback,
          id: feedback._id?.toString(),
          _id: undefined,
          fromUserId: feedback.fromUserId?.toString ? feedback.fromUserId.toString() : feedback.fromUserId,
          toUserId: feedback.toUserId?.toString ? feedback.toUserId.toString() : feedback.toUserId,
          fromUserName: fromUser?.name || "Unknown",
          toUserName: toUser?.name || "Unknown",
        }
      })
    )

    return NextResponse.json({ feedback: feedbackWithUserDetails })
  } catch (error) {
    console.error("Error fetching admin feedback:", error)
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
  }
}
