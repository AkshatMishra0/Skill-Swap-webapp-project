import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/User"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const db = await getDatabase()
    const users = db.collection<User>("users")

    const { id } = await context.params
    const user = await users.findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Calculate completed swaps count for this user
    const completedSwapsCount = await db.collection("swapRequests").countDocuments({
      $or: [
        { senderId: new ObjectId(id), status: "completed" },
        { receiverId: new ObjectId(id), status: "completed" }
      ]
    })

    // Get review count for this user
    const reviewCount = await db.collection("feedback").countDocuments({
      toUserId: id
    })

    const formattedUser = {
      ...user,
      id: user._id?.toString(),
      _id: undefined,
      completedSwaps: completedSwapsCount,
      reviewCount: reviewCount
    }

    return NextResponse.json({ user: formattedUser })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
