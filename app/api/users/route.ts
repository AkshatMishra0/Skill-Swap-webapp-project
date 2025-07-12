import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/User"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const availability = searchParams.get("availability") || "all"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "6")
    const skip = (page - 1) * limit

    const db = await getDatabase()
    const users = db.collection<User>("users")

    // Build query
    const query: any = {
      isPublic: true,
      status: "active",
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { skillsOffered: { $in: [new RegExp(search, "i")] } }]
    }

    if (availability !== "all") {
      query.availability = availability
    }

    const totalUsers = await users.countDocuments(query)
    const userList = await users
      .find(query, { projection: { password: 0 } })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Calculate stats for each user
    const formattedUsers = await Promise.all(
      userList.map(async (user) => {
        const userId = user._id?.toString()
        
        // Calculate completed swaps count
        const completedSwapsCount = await db.collection("swapRequests").countDocuments({
          $or: [
            { senderId: user._id, status: "completed" },
            { receiverId: user._id, status: "completed" }
          ]
        })

        // Get review count
        const reviewCount = await db.collection("feedback").countDocuments({
          toUserId: userId
        })

        return {
          ...user,
          id: userId,
          _id: undefined,
          completedSwaps: completedSwapsCount,
          reviewCount: reviewCount
        }
      })
    )

    return NextResponse.json({
      users: formattedUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      totalUsers,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
