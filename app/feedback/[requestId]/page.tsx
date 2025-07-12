"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import FeedbackForm from "@/components/feedback-form"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export default function FeedbackPage({ params }: { params: Promise<{ requestId: string }> }) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [request, setRequest] = useState<any>(null)
  const [targetUser, setTargetUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [requestId, setRequestId] = useState<string>("")

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      const resolvedParams = await params
      const { requestId } = resolvedParams
      setRequestId(requestId)
      try {
        const res = await fetch(`/api/requests/${requestId}`)
        if (!res.ok) {
          let errorMsg = "Request not found"
          try {
            const errorData = await res.json()
            errorMsg = errorData.error || errorMsg
          } catch {
            errorMsg = await res.text()
          }
          throw new Error(errorMsg)
        }
        const data = await res.json()
        if (isMounted) setRequest(data.request)
        console.log("Request data:", data.request) // Debug log
        
        // Determine which user to fetch (the other user in the swap)
        const targetUserId = currentUser?.id === data.request.senderId ? data.request.receiverId : data.request.senderId
        
        const userRes = await fetch(`/api/users/${targetUserId}`)
        if (!userRes.ok) {
          let errorMsg = "User not found"
          try {
            const errorData = await userRes.json()
            errorMsg = errorData.error || errorMsg
          } catch {
            errorMsg = await userRes.text()
          }
          throw new Error(errorMsg)
        }
        const userData = await userRes.json()
        if (isMounted) setTargetUser(userData.user)
      } catch (err: any) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [params, currentUser])

  if (loading) return <Loader2 className="h-8 w-8 animate-spin" />
  if (error || !request || !targetUser || !currentUser) {
    return <div className="text-red-600">{error || "Error loading data"}</div>
  }

  // Determine target user ID (the other user in the swap)
  const targetUserId = currentUser.id === request.senderId ? request.receiverId : request.senderId

  return (
    <div className="max-w-xl mx-auto py-8">
      {/* Navigation Header */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Feedback & Requests</h1>
        <p className="text-gray-600">Leave feedback or request a new skill swap</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={targetUser.avatar || "/placeholder.svg"} alt={targetUser.name} />
              <AvatarFallback>{targetUser.name.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{targetUser.name}</CardTitle>
              <div className="text-gray-600 text-sm">{targetUser.location || "Location not set"}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="font-medium mb-2">Skills Offered:</div>
            <div className="flex flex-wrap gap-1">
              {targetUser.skillsOffered.map((skill: string) => (
                <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{skill}</span>
              ))}
            </div>
          </div>

          {/* Feedback Form */}
          <FeedbackForm 
            fromUserId={currentUser.id}
            toUserId={targetUserId}
            canGiveFeedback={true}
            toUserName={targetUser.name}
            swapRequestId={request._id}
            skills={[request.skillOffered, request.skillWanted].filter(Boolean)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
