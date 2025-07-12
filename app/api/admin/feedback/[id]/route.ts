import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken, getUserById } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const feedback = db.collection("feedback")

    // Get the feedback before deletion to update user ratings
    const feedbackToDelete = await feedback.findOne({ _id: new ObjectId(params.id) })
    
    if (!feedbackToDelete) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    // Delete the feedback
    await feedback.deleteOne({ _id: new ObjectId(params.id) })

    // Update the user's rating by recalculating from remaining feedback
    const users = db.collection("users")
    const remainingFeedback = await feedback.find({ toUserId: feedbackToDelete.toUserId }).toArray()
    
    if (remainingFeedback.length > 0) {
      const avgRating = remainingFeedback.reduce((sum, f) => sum + f.rating, 0) / remainingFeedback.length
      await users.updateOne(
        { _id: feedbackToDelete.toUserId },
        { 
          $set: { 
            rating: avgRating,
            totalRatings: remainingFeedback.length,
            updatedAt: new Date()
          } 
        }
      )
    } else {
      await users.updateOne(
        { _id: feedbackToDelete.toUserId },
        { 
          $set: { 
            rating: 0,
            totalRatings: 0,
            updatedAt: new Date()
          } 
        }
      )
    }

    return NextResponse.json({ message: "Feedback deleted successfully" })
  } catch (error) {
    console.error("Error deleting feedback:", error)
    return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 })
  }
}
