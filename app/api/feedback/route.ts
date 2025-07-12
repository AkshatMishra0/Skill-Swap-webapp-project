import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Get all feedback for this user with reviewer information
    const feedback = await db.collection("feedback").aggregate([
      { $match: { toUserId: userId } },
      {
        $addFields: {
          fromUserObjectId: { $toObjectId: "$fromUserId" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "fromUserObjectId",
          foreignField: "_id",
          as: "fromUser",
          pipeline: [
            {
              $project: {
                name: 1,
                avatar: 1,
                _id: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          fromUser: { $arrayElemAt: ["$fromUser", 0] }
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray()

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error("Feedback fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch feedback." }, { status: 500 })
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

    const { fromUserId, toUserId, rating, comment, swapRequestId, skill } = await request.json()
    
    if (!fromUserId || !toUserId || rating === undefined || rating === null) {
      console.log("Missing fields:", { fromUserId, toUserId, rating, comment, swapRequestId, skill })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Check if a completed swap exists between users
    const swap = await db.collection("swapRequests").findOne({
      $or: [
        { senderId: new ObjectId(fromUserId), receiverId: new ObjectId(toUserId), status: "completed" },
        { senderId: new ObjectId(toUserId), receiverId: new ObjectId(fromUserId), status: "completed" }
      ]
    })
    
    if (!swap) {
      return NextResponse.json({ 
        error: "Feedback can only be submitted after completing a skill swap with this user." 
      }, { status: 403 })
    }

    // Check if feedback already exists
    const existingFeedback = await db.collection("feedback").findOne({
      fromUserId: fromUserId,
      toUserId: toUserId
    })

    if (existingFeedback) {
      return NextResponse.json({ 
        error: "You have already submitted feedback for this user." 
      }, { status: 400 })
    }

    // Save feedback
    const feedbackData = {
      fromUserId,
      toUserId,
      rating: Number(rating),
      comment: comment || "",
      skill: skill || "",
      swapRequestId: swapRequestId || swap._id?.toString(),
      createdAt: new Date()
    }

    await db.collection("feedback").insertOne(feedbackData)

    // Update user's average rating
    const feedbacks = await db.collection("feedback").find({ toUserId }).toArray()
    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0)
    const avgRating = totalRating / feedbacks.length

    await db.collection("users").updateOne(
      { _id: new ObjectId(toUserId) },
      { $set: { rating: avgRating, totalRatings: feedbacks.length } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Feedback submission error:", error)
    return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 })
  }
}
