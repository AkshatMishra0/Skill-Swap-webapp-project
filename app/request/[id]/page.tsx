"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, ArrowRight, Send, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import RequestReview from "@/components/request-review"
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog"

interface User {
  id: string
  name: string
  avatar?: string
  location?: string
  skillsOffered: string[]
  skillsWanted: string[]
  availability: string[]
  rating: number
}

export default function RequestSwapPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState("")
  const [selectedWantedSkill, setSelectedWantedSkill] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [requestStatus, setRequestStatus] = useState<string>("")
  const [requestId, setRequestId] = useState<string>("")
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [requestData, setRequestData] = useState<any>(null)

  useEffect(() => {
    async function handleParams() {
      const { id } = await params
      setRequestId(id)
      if (!authLoading) {
        if (!user) {
          router.push("/login")
          return
        }

        if (id === user.id) {
          router.push("/profile")
          return
        }

        fetchTargetUser(id)
      }
    }
    handleParams()
  }, [user, authLoading, params, router])

  useEffect(() => {
    async function fetchRequestDetails() {
      const { id } = await params
      setRequestId(id)
      try {
        const res = await fetch(`/api/requests/${id}`)
        if (!res.ok) {
          let errorMsg = "Request not found"
          try {
            const errorData = await res.json()
            errorMsg = errorData.error || errorMsg
          } catch {
            errorMsg = await res.text()
          }
          setError(errorMsg)
          setRequestStatus("")
          return
        }
        const data = await res.json()
        if (data.request) {
          setRequestStatus(data.request.status)
          setRequestData(data.request)
        }
      } catch (err) {
        setError("Failed to fetch request details")
        setRequestStatus("")
      }
    }
    fetchRequestDetails()
  }, [params])

  const fetchTargetUser = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) {
        let errorMsg = "User not found"
        try {
          const errorData = await response.json()
          errorMsg = errorData.error || errorMsg
        } catch {
          errorMsg = await response.text()
        }
        setError(errorMsg)
        return
      }
      const data = await response.json()
      setTargetUser(data.user)
      setError("")
    } catch (err) {
      setError("Failed to fetch user")
      console.error("Error fetching user:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage("")

    if (!selectedOfferedSkill || !selectedWantedSkill) {
      setSubmitMessage("Please select both skills for the swap.")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: (await params).id,
          skillOffered: selectedOfferedSkill,
          skillWanted: selectedWantedSkill,
          message: message.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitMessage("Swap request sent successfully!")
        setTimeout(() => {
          router.push("/requests")
        }, 2000)
      } else {
        setSubmitMessage(data.error || "Failed to send request. Please try again.")
      }
    } catch (error) {
      setSubmitMessage("Failed to send request. Please try again.")
      console.error("Error sending request:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || !targetUser) {
    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      )
    }
    return null
  }

  const availableOfferedSkills = user.skillsOffered?.filter((skill) => targetUser.skillsWanted.includes(skill)) || []
  const availableWantedSkills = targetUser.skillsOffered?.filter((skill) => user.skillsWanted?.includes(skill)) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">SkillSwap</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">Home</Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost">Profile</Button>
              </Link>
              <Link href="/requests">
                <Button variant="ghost">Requests</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Request Skill Swap</h2>
          <p className="text-gray-600">Propose a skill exchange with {targetUser.name}</p>
        </div>

        {submitMessage && (
          <Alert
            className={`mb-6 ${submitMessage.includes("success") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
          >
            <AlertDescription>{submitMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Target User Profile */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={targetUser.avatar || "/placeholder.svg"} alt={targetUser.name} />
                    <AvatarFallback className="text-lg">
                      {targetUser.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{targetUser.name}</CardTitle>
                    <CardDescription>{targetUser.location || "Location not set"}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Skills Offered</h4>
                  <div className="flex flex-wrap gap-1">
                    {targetUser.skillsOffered.map((skill: string) => (
                      <Badge key={skill} variant="default" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Wants to Learn</h4>
                  <div className="flex flex-wrap gap-1">
                    {targetUser.skillsWanted.map((skill: string) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Availability</h4>
                  <div className="flex flex-wrap gap-1">
                    {targetUser.availability.map((time: string) => (
                      <Badge key={time} variant="secondary" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Swap Request Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Propose Skill Exchange</CardTitle>
                <CardDescription>Select the skills you want to exchange and add a personal message</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Skill Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="space-y-2">
                      <Label>I can teach</Label>
                      <Select value={selectedOfferedSkill} onValueChange={setSelectedOfferedSkill}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select skill" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOfferedSkills.length > 0 ? (
                            availableOfferedSkills.map((skill) => (
                              <SelectItem key={skill} value={skill}>
                                {skill}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No matching skills
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {availableOfferedSkills.length === 0 && (
                        <p className="text-xs text-red-600">
                          You don't have skills that {targetUser.name} wants to learn
                        </p>
                      )}
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                    </div>

                    <div className="space-y-2">
                      <Label>I want to learn</Label>
                      <Select value={selectedWantedSkill} onValueChange={setSelectedWantedSkill}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select skill" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableWantedSkills.length > 0 ? (
                            availableWantedSkills.map((skill) => (
                              <SelectItem key={skill} value={skill}>
                                {skill}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No matching skills
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {availableWantedSkills.length === 0 && (
                        <p className="text-xs text-red-600">{targetUser.name} doesn't offer skills you want to learn</p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Personal Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Introduce yourself and explain why you'd like to do this skill swap..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4">
                    <Link href="/">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting || availableOfferedSkills.length === 0 || availableWantedSkills.length === 0
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Request
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Compatibility Info */}
            {(availableOfferedSkills.length === 0 || availableWantedSkills.length === 0) && (
              <Card className="mt-6 border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-yellow-800">Limited Compatibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-yellow-700 text-sm">
                    You and {targetUser.name} don't have perfectly matching skills for a swap. Consider updating your
                    profile to add more skills, or browse other users who might be a better match.
                  </p>
                  <div className="mt-4 flex space-x-2">
                    <Link href="/profile">
                      <Button size="sm" variant="outline">
                        Update My Skills
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button size="sm" variant="outline">
                        Browse Other Users
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Request Review Component */}
            {requestStatus === "completed" && targetUser && (
              <div className="mt-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-star h-4 w-4 mr-1"
                      >
                        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                      </svg>
                      Leave Feedback
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <RequestReview
                      requestId={requestId}
                      userId={user.id}
                      targetUserId={targetUser.id}
                      status={requestStatus}
                      toUserName={targetUser.name}
                      skillOffered={requestData?.skillOffered}
                      skillWanted={requestData?.skillWanted}
                    />
                    <DialogClose asChild>
                      <Button variant="outline" className="mt-4">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
