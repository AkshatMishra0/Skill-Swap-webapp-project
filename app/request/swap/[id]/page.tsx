"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Home, 
  MessageSquare,
  User,
  Settings,
  ArrowRight,
  Send,
  Loader2,
  Users
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface TargetUser {
  id: string
  name: string
  email: string
  avatar?: string
  location?: string
  skillsOffered: string[]
  skillsWanted: string[]
  rating: number
}

export default function SkillSwapRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [targetUser, setTargetUser] = useState<TargetUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [selectedMySkills, setSelectedMySkills] = useState<string[]>([])
  const [selectedTheirSkills, setSelectedTheirSkills] = useState<string[]>([])
  const [requestMessage, setRequestMessage] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function fetchTargetUser() {
      try {
        const { id } = await params
        const response = await fetch(`/api/users/${id}`)
        
        if (response.ok) {
          const data = await response.json()
          const userData = data.user || data
          setTargetUser(userData)
        } else {
          setMessage("User not found")
        }
      } catch (error) {
        setMessage("Failed to load user data")
      } finally {
        setLoading(false)
      }
    }

    fetchTargetUser()
  }, [params])

  const toggleMySkill = (skill: string) => {
    setSelectedMySkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const toggleTheirSkill = (skill: string) => {
    setSelectedTheirSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    if (selectedMySkills.length === 0) {
      setMessage("Please select at least one skill you can offer")
      setIsSubmitting(false)
      return
    }

    if (selectedTheirSkills.length === 0) {
      setMessage("Please select at least one skill you want to learn")
      setIsSubmitting(false)
      return
    }

    if (!requestMessage.trim()) {
      setMessage("Please add a message describing your request")
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
          receiverId: targetUser?.id,
          skillOffered: selectedMySkills.join(", "),
          skillWanted: selectedTheirSkills.join(", "),
          message: requestMessage,
          type: "skill_swap_request"
        }),
      })

      if (response.ok) {
        setMessage("Skill swap request sent successfully!")
        setTimeout(() => {
          router.push("/requests")
        }, 2000)
      } else {
        const error = await response.json()
        setMessage(error.error || "Failed to send request")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600 mb-4">The user you're trying to request a skill swap with could not be found.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const compatibleSkills = user.skillsOffered?.filter(skill => 
    targetUser.skillsWanted?.includes(skill)
  ) || []

  const availableToLearn = targetUser.skillsOffered?.filter(skill => 
    user.skillsWanted?.includes(skill)
  ) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer">
                  SkillSwap
                </h1>
              </Link>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Skill Swap Request
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Button>
              </Link>
              <Link href="/requests">
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  My Requests
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Target User Info */}
        <Card className="mb-6 bg-white/60 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={targetUser.avatar} alt={targetUser.name} />
                <AvatarFallback>{(targetUser.name || "U").charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">Request Skill Swap with {targetUser.name}</h2>
                <p className="text-gray-600">Select skills to exchange and send your request</p>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {message && (
          <Alert className={`mb-6 ${message.includes("successfully") ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <AlertDescription className={message.includes("successfully") ? "text-green-700" : "text-red-700"}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Skills I Can Offer */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle>Skills I Can Offer</CardTitle>
              <CardDescription>
                Select skills from your profile that {targetUser.name} wants to learn
                {compatibleSkills.length > 0 && (
                  <span className="text-green-600 font-medium"> ({compatibleSkills.length} compatible skills found!)</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.skillsOffered && user.skillsOffered.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {user.skillsOffered.map((skill) => {
                    const isCompatible = compatibleSkills.includes(skill)
                    return (
                      <div key={skill} className={`flex items-center space-x-2 p-2 rounded-lg ${isCompatible ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <Checkbox
                          id={`my-skill-${skill}`}
                          checked={selectedMySkills.includes(skill)}
                          onCheckedChange={() => toggleMySkill(skill)}
                        />
                        <Label htmlFor={`my-skill-${skill}`} className="text-sm cursor-pointer flex items-center">
                          {skill}
                          {isCompatible && <span className="ml-1 text-green-600">✓</span>}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic">No skills in your profile. Please add skills to your profile first.</p>
              )}
            </CardContent>
          </Card>

          {/* Skills I Want to Learn */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle>Skills I Want to Learn from {targetUser.name}</CardTitle>
              <CardDescription>
                Select skills that {targetUser.name} can teach you
                {availableToLearn.length > 0 && (
                  <span className="text-blue-600 font-medium"> ({availableToLearn.length} skills available from your wishlist!)</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {targetUser.skillsOffered && targetUser.skillsOffered.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {targetUser.skillsOffered.map((skill) => {
                    const isWanted = availableToLearn.includes(skill)
                    return (
                      <div key={skill} className={`flex items-center space-x-2 p-2 rounded-lg ${isWanted ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                        <Checkbox
                          id={`their-skill-${skill}`}
                          checked={selectedTheirSkills.includes(skill)}
                          onCheckedChange={() => toggleTheirSkill(skill)}
                        />
                        <Label htmlFor={`their-skill-${skill}`} className="text-sm cursor-pointer flex items-center">
                          {skill}
                          {isWanted && <span className="ml-1 text-blue-600">★</span>}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic">{targetUser.name} has not listed any skills they can offer.</p>
              )}
            </CardContent>
          </Card>

          {/* Message */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle>Your Message</CardTitle>
              <CardDescription>
                Write a message to {targetUser.name} explaining your skill swap request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder={`Hi ${targetUser.name}! I'd love to do a skill swap with you. I can help you with [your selected skills] and I'm interested in learning [their selected skills] from you. Let me know if you're interested!`}
                rows={4}
                className="bg-white/70 border-white/30"
                required
              />
            </CardContent>
          </Card>

          {/* Selected Skills Summary */}
          {(selectedMySkills.length > 0 || selectedTheirSkills.length > 0) && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Skill Swap Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">You will offer:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMySkills.map(skill => (
                        <Badge key={skill} className="bg-green-100 text-green-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">You will learn:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTheirSkills.map(skill => (
                        <Badge key={skill} className="bg-blue-100 text-blue-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link href="/">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting || selectedMySkills.length === 0 || selectedTheirSkills.length === 0}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending Request...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="h-4 w-4 mr-2" />
                  Send Skill Swap Request
                </div>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
