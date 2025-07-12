import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken, getUserById } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const result = await feedback.findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          flagged: true,
          flaggedBy: decoded.userId,
          flaggedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    return NextResponse.json({
      feedback: {
        ...result,
        id: result._id?.toString(),
        _id: undefined,
      },
    })
  } catch (error) {
    console.error("Error flagging feedback:", error)
    return NextResponse.json({ error: "Failed to flag feedback" }, { status: 500 })
  }
}
