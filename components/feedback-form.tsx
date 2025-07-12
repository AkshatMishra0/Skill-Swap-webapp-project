import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Users, ArrowRight } from "lucide-react"

export default function FeedbackForm({ fromUserId, toUserId, canGiveFeedback, toUserName, swapRequestId, skills = [] }: { fromUserId: string, toUserId: string, canGiveFeedback: boolean, toUserName?: string, swapRequestId?: string, skills?: string[] }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [selectedSkill, setSelectedSkill] = useState(skills[0] || "")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false)
  const [eligibilityChecked, setEligibilityChecked] = useState(false)
  const [eligibilityResult, setEligibilityResult] = useState<any>(null)
  const [isRequestingSwap, setIsRequestingSwap] = useState(false)

  const checkEligibility = async () => {
    setIsCheckingEligibility(true)
    setMessage("")
    try {
      const res = await fetch(`/api/feedback/can-leave?targetId=${toUserId}`)
      const data = await res.json()
      
      setEligibilityResult(data)
      setEligibilityChecked(true)
      
      if (data.canLeave) {
        setMessage("✅ You are eligible to leave feedback for this user!")
      } else {
        setMessage(`❌ ${data.reason || "You cannot leave feedback for this user"}`)
      }
    } catch (err) {
      setMessage("Error checking eligibility")
    } finally {
      setIsCheckingEligibility(false)
    }
  }

  const handleRequestSwap = async () => {
    setIsRequestingSwap(true)
    setMessage("")
    try {
      // Get target user's skills first
      const userRes = await fetch(`/api/users/${toUserId}`)
      if (!userRes.ok) {
        throw new Error("Failed to fetch user data")
      }
      const userData = await userRes.json()
      
      // Navigate to request swap page
      window.location.href = `/request/${toUserId}`
    } catch (err) {
      setMessage("❌ Error navigating to request swap page")
    } finally {
      setIsRequestingSwap(false)
    }
  }

  const handleSubmit = async () => {
    if (!fromUserId || !toUserId || fromUserId === "" || toUserId === "") {
      setMessage("Error: Missing user information")
      return
    }
    
    setIsSubmitting(true)
    setMessage("")
    try {
      const payload = { fromUserId, toUserId, rating, comment, swapRequestId, skill: selectedSkill }
      
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("✅ Feedback submitted successfully!")
        setComment("")
        setRating(5)
        setSelectedSkill(skills[0] || "")
        // Reset eligibility check so user can see the success message
        setEligibilityChecked(false)
        setEligibilityResult(null)
      } else {
        setMessage(`❌ ${data.error || "Error submitting feedback."}`)
      }
    } catch (err) {
      console.error("Feedback submit error", err)
      setMessage("Error submitting feedback.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Request Swap Section - Prominent and Always visible */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2 mb-3">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Want to learn more?</h3>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          Request another skill swap with {toUserName} to continue learning together!
        </p>
        <Button 
          onClick={handleRequestSwap} 
          disabled={isRequestingSwap}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isRequestingSwap ? (
            "Redirecting..."
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              Request Swap with {toUserName}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Separator */}
      <div className="border-t pt-4">
        <h3 className="font-medium text-lg mb-2">Leave Feedback</h3>
        <p className="text-sm text-gray-600">
          Share your experience from your skill swap with {toUserName}
        </p>
      </div>

      {/* Eligibility Check Section */}
      {!eligibilityChecked && (
        <div className="space-y-3">
          <Label className="text-base font-medium">Check Feedback Eligibility</Label>
          <p className="text-sm text-gray-600">
            Check if you can leave feedback for {toUserName}
          </p>
          <Button 
            onClick={checkEligibility} 
            disabled={isCheckingEligibility}
            variant="outline"
            className="w-full"
          >
            {isCheckingEligibility ? "Checking..." : "Check Eligibility"}
          </Button>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.includes("✅") ? "bg-green-50 text-green-800" : 
          message.includes("❌") ? "bg-red-50 text-red-800" : 
          "bg-blue-50 text-blue-800"
        }`}>
          {message}
        </div>
      )}

      {/* Feedback Form - Only show if eligible */}
      {eligibilityChecked && eligibilityResult?.canLeave && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <Label>Rate your experience{toUserName ? ` with ${toUserName}` : ""}</Label>
            <div className="flex items-center space-x-2 mt-2">
              {[1,2,3,4,5].map((star) => (
                <Button
                  key={star}
                  type="button"
                  variant={rating >= star ? "default" : "outline"}
                  onClick={() => setRating(star)}
                  className="px-2 py-1"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  {"★"}
                </Button>
              ))}
              <span className="ml-2 text-sm">{rating} / 5</span>
            </div>
          </div>

          {skills.length > 0 && (
            <div className="space-y-2">
              <Label>Select skill to rate</Label>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Select skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill} value={skill || ""}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Feedback</Label>
            <Textarea 
              value={comment} 
              onChange={e => setComment(e.target.value)} 
              placeholder="Write your feedback..." 
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !selectedSkill}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
            <Button 
              onClick={() => {
                setEligibilityChecked(false)
                setEligibilityResult(null)
                setMessage("")
              }}
              variant="outline"
            >
              Check Again
            </Button>
          </div>
        </div>
      )}

      {/* Re-check button if not eligible */}
      {eligibilityChecked && !eligibilityResult?.canLeave && (
        <Button 
          onClick={() => {
            setEligibilityChecked(false)
            setEligibilityResult(null)
            setMessage("")
          }}
          variant="outline"
          className="w-full"
        >
          Check Eligibility Again
        </Button>
      )}
    </div>
  )
}
