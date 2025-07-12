import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken, getUserById } from "@/lib/auth"

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

    const user = await getUserById(decoded.userId)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { message } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const notifications = db.collection("notifications")

    // Get all active users
    const users = db.collection("users")
    const activeUsers = await users
      .find({ status: { $ne: "banned" } }, { projection: { _id: 1 } })
      .toArray()

    // Create notification for each user
    const notificationPromises = activeUsers.map(async (targetUser) => {
      await notifications.insertOne({
        userId: targetUser._id,
        type: "broadcast",
        title: "System Announcement",
        message: message.trim(),
        read: false,
        createdAt: new Date(),
      })
    })

    await Promise.all(notificationPromises)

    return NextResponse.json({ 
      message: "Broadcast message sent successfully",
      recipientCount: activeUsers.length
    })
  } catch (error) {
    console.error("Error sending broadcast:", error)
    return NextResponse.json({ error: "Failed to send broadcast message" }, { status: 500 })
  }
}
