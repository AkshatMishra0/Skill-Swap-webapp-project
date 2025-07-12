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

    const { status } = await request.json()

    if (!["pending", "accepted", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const db = await getDatabase()
    const requests = db.collection("swapRequests")

    const result = await requests.findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: status,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Swap request not found" }, { status: 404 })
    }

    return NextResponse.json({
      request: {
        ...result,
        id: result._id?.toString(),
        _id: undefined,
      },
    })
  } catch (error) {
    console.error("Error updating swap status:", error)
    return NextResponse.json({ error: "Failed to update swap status" }, { status: 500 })
  }
}
