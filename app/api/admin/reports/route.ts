import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken, getUserById } from "@/lib/auth"

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

    const url = new URL(request.url)
    const reportType = url.searchParams.get("type") || "users"
    const dateRange = url.searchParams.get("range") || "all"

    const db = await getDatabase()
    let data: any[] = []
    let csvContent = ""

    // Calculate date filter
    let dateFilter: any = {}
    if (dateRange !== "all") {
      const now = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case "week":
          startDate.setDate(now.getDate() - 7)
          break
        case "month":
          startDate.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          startDate.setMonth(now.getMonth() - 3)
          break
        case "year":
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      dateFilter = { createdAt: { $gte: startDate } }
    }

    switch (reportType) {
      case "users":
        const users = db.collection("users")
        data = await users
          .find(dateFilter, { projection: { password: 0 } })
          .toArray()
        
        csvContent = "ID,Name,Email,Role,Status,Skills Offered,Skills Wanted,Rating,Total Ratings,Created At\n"
        data.forEach((user) => {
          csvContent += `${user._id},${user.name},${user.email},${user.role},${user.status},"${user.skillsOffered?.join('; ')}","${user.skillsWanted?.join('; ')}",${user.rating},${user.totalRatings},${user.createdAt}\n`
        })
        break

      case "swaps":
        const requests = db.collection("swapRequests")
        const users2 = db.collection("users")
        data = await requests.find(dateFilter).toArray()
        
        csvContent = "ID,Sender,Receiver,Skill Offered,Skill Wanted,Status,Message,Created At,Updated At\n"
        
        for (const swap of data) {
          const sender = await users2.findOne({ _id: swap.senderId })
          const receiver = await users2.findOne({ _id: swap.receiverId })
          
          csvContent += `${swap._id},${sender?.name || 'Unknown'},${receiver?.name || 'Unknown'},${swap.skillOffered},${swap.skillWanted},${swap.status},"${swap.message}",${swap.createdAt},${swap.updatedAt}\n`
        }
        break

      case "feedback":
        const feedback = db.collection("feedback")
        const users3 = db.collection("users")
        data = await feedback.find(dateFilter).toArray()
        
        csvContent = "ID,From User,To User,Rating,Skill,Comment,Created At\n"
        
        for (const review of data) {
          const fromUser = await users3.findOne({ _id: review.fromUserId })
          const toUser = await users3.findOne({ _id: review.toUserId })
          
          csvContent += `${review._id},${fromUser?.name || 'Unknown'},${toUser?.name || 'Unknown'},${review.rating},${review.skill},"${review.comment}",${review.createdAt}\n`
        }
        break

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
