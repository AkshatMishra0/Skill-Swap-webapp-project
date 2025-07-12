import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import FeedbackForm from "@/components/feedback-form"

interface RequestReviewProps {
  requestId: string
  userId: string
  targetUserId: string
  status: string
  toUserName?: string
  skillOffered?: string
  skillWanted?: string
}

export default function RequestReview({ requestId, userId, targetUserId, status, toUserName, skillOffered, skillWanted }: RequestReviewProps) {
  const [canReview, setCanReview] = useState(false)
  const [canLeaveFeedback, setCanLeaveFeedback] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  useEffect(() => {
    setCanReview(status === "completed")
    if (status === "completed") {
      checkCanLeaveFeedback()
    }
  }, [status, requestId, userId, targetUserId])
  
  const checkCanLeaveFeedback = async () => {
    try {
      const res = await fetch(`/api/feedback/can-leave?targetId=${targetUserId}`)
      if (!res.ok) {
        const errorData = await res.json()
        setError(errorData.error || "Failed to check feedback eligibility")
        setCanLeaveFeedback(false)
        return
      }
      const data = await res.json()
      setCanLeaveFeedback(data.canLeave)
    } catch (err) {
      setError("Failed to check feedback eligibility")
      setCanLeaveFeedback(false)
    } finally {
      setLoading(false)
    }
  }
  
  if (!canReview) return null
  
  if (loading) {
    return <div className="p-4">Loading...</div>
  }
  
  if (error) {
    return <div className="p-4 text-red-600">{error}</div>
  }
  
  if (!canLeaveFeedback) {
    return <div className="p-4 text-gray-600">You have already left feedback for this request.</div>
  }
  
  // Get skills for the feedback form
  const skills = skillOffered ? [skillOffered] : []
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Leave Feedback</h3>
      <FeedbackForm
        fromUserId={userId}
        toUserId={targetUserId}
        canGiveFeedback={canLeaveFeedback}
        toUserName={toUserName}
        swapRequestId={requestId}
        skills={skills}
      />
    </div>
  )
}
