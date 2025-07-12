"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Plus, MapPin, Star, Users, Camera, Upload } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import FeedbackForm from "@/components/feedback-form"

const availabilityOptions = ["weekends", "evenings", "flexible", "mornings", "weekdays"]
const skillSuggestions = [
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "Design",
  "Photography",
  "Writing",
  "Marketing",
  "Data Analysis",
  "Machine Learning",
  "UI/UX",
  "Project Management",
  "Spanish",
  "French",
  "Guitar",
  "Piano",
  "Cooking",
  "Fitness",
  "Yoga",
  "Drawing",
]

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    bio: "",
    skillsOffered: [] as string[],
    skillsWanted: [] as string[],
    availability: [] as string[],
    isPublic: true,
    avatar: "",
  })

  const [newSkillOffered, setNewSkillOffered] = useState("")
  const [newSkillWanted, setNewSkillWanted] = useState("")
  const [isChangingAvatar, setIsChangingAvatar] = useState(false)
  const [newAvatarPreview, setNewAvatarPreview] = useState("")

  // Helper to check if user can give feedback
  const [canGiveFeedback, setCanGiveFeedback] = useState(false)

  useEffect(() => {
    async function checkSwap() {
      if (!user) return
      // For now, only allow feedback for own profile
      const res = await fetch(`/api/requests?userId=${user.id}&otherId=${user.id}`)
      const data = await res.json()
      setCanGiveFeedback(data.completedSwap)
    }
    checkSwap()
  }, [user])

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    setFormData({
      name: user.name || "",
      location: user.location || "",
      bio: user.bio || "",
      skillsOffered: user.skillsOffered || [],
      skillsWanted: user.skillsWanted || [],
      availability: user.availability || [],
      isPublic: user.isPublic !== false,
      avatar: user.avatar || "",
    })
  }, [user, router])

  if (!user) {
    return null
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage("")

    try {
      await updateUser(formData)
      setMessage("Profile updated successfully!")
      setIsEditing(false)
    } catch (error) {
      setMessage("Failed to update profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    setFormData({
      name: user.name || "",
      location: user.location || "",
      bio: user.bio || "",
      skillsOffered: user.skillsOffered || [],
      skillsWanted: user.skillsWanted || [],
      availability: user.availability || [],
      isPublic: user.isPublic !== false,
      avatar: user.avatar || "",
    })
    setIsEditing(false)
    setIsChangingAvatar(false)
    setNewAvatarPreview("")
    setMessage("")
  }

  const addSkill = (type: "offered" | "wanted", skill: string) => {
    if (!skill.trim()) return

    const field = type === "offered" ? "skillsOffered" : "skillsWanted"
    if (!formData[field].includes(skill.trim())) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], skill.trim()],
      }))
    }

    if (type === "offered") {
      setNewSkillOffered("")
    } else {
      setNewSkillWanted("")
    }
  }

  const removeSkill = (type: "offered" | "wanted", skill: string) => {
    const field = type === "offered" ? "skillsOffered" : "skillsWanted"
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((s) => s !== skill),
    }))
  }

  const toggleAvailability = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter((a) => a !== option)
        : [...prev.availability, option],
    }))
  }

  // Avatar handling functions
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage("Avatar file must be less than 5MB")
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setNewAvatarPreview(result)
        setFormData(prev => ({ ...prev, avatar: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarRemove = () => {
    setNewAvatarPreview("")
    setFormData(prev => ({ ...prev, avatar: "" }))
  }

  const handleCancelAvatarChange = () => {
    setIsChangingAvatar(false)
    setNewAvatarPreview("")
    setFormData(prev => ({ ...prev, avatar: user.avatar || "" }))
  }

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
              <Link href="/requests">
                <Button variant="ghost">Requests</Button>
              </Link>
              {user.role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost">Admin</Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert className={`mb-6 ${message.includes("success") ? "border-green-200 bg-green-50" : ""}`}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={newAvatarPreview || user.avatar || "/placeholder.svg"} 
                      alt={user.name} 
                    />
                    <AvatarFallback className="text-lg">
                      {user.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer group hover:bg-opacity-70 transition-all">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-white hover:bg-transparent p-0 h-auto"
                        onClick={() => setIsChangingAvatar(true)}
                      >
                        <Camera className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Avatar Upload Modal */}
                {isChangingAvatar && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Change Profile Photo</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelAvatarChange}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <Avatar className="h-32 w-32">
                            <AvatarImage 
                              src={newAvatarPreview || user.avatar || "/placeholder.svg"} 
                              alt={user.name} 
                            />
                            <AvatarFallback className="text-2xl">
                              {user.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="avatar-upload">Upload New Photo</Label>
                          <div className="flex items-center space-x-2">
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                              className="flex-1"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Choose Photo
                            </Button>
                            {(newAvatarPreview || user.avatar) && (
                              <Button
                                variant="outline"
                                onClick={handleAvatarRemove}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Recommended: Square image, max 5MB
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={handleCancelAvatarChange}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => setIsChangingAvatar(false)}
                            className="flex-1"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {user.location || "Location not set"}
                  </CardDescription>
                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">
                      {user.rating ? `${user.rating.toFixed(2)} / 5` : "No ratings yet"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleDiscard}>
                      Discard
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell others about yourself and your interests..."
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
            </div>

            {/* Skills Offered */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Skills I Can Offer</h3>
              <div className="flex flex-wrap gap-2">
                {formData.skillsOffered.map((skill) => (
                  <Badge key={skill} variant="default" className="flex items-center gap-1">
                    {skill}
                    {isEditing && (
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill("offered", skill)} />
                    )}
                  </Badge>
                ))}
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill you can teach"
                    value={newSkillOffered}
                    onChange={(e) => setNewSkillOffered(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addSkill("offered", newSkillOffered)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => addSkill("offered", newSkillOffered)}
                    disabled={!newSkillOffered.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Skills Wanted */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Skills I Want to Learn</h3>
              <div className="flex flex-wrap gap-2">
                {formData.skillsWanted.map((skill) => (
                  <Badge key={skill} variant="outline" className="flex items-center gap-1">
                    {skill}
                    {isEditing && <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill("wanted", skill)} />}
                  </Badge>
                ))}
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill you want to learn"
                    value={newSkillWanted}
                    onChange={(e) => setNewSkillWanted(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addSkill("wanted", newSkillWanted)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => addSkill("wanted", newSkillWanted)}
                    disabled={!newSkillWanted.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Availability</h3>
              <div className="flex flex-wrap gap-2">
                {availabilityOptions.map((option) => (
                  <Badge
                    key={option}
                    variant={formData.availability.includes(option) ? "default" : "outline"}
                    className={`cursor-pointer ${isEditing ? "hover:bg-blue-100" : ""}`}
                    onClick={() => isEditing && toggleAvailability(option)}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Privacy Settings</h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="public-profile">Public Profile</Label>
                  <p className="text-sm text-gray-600">Allow others to find and contact you</p>
                </div>
                <Switch
                  id="public-profile"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked }))}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Feedback Form */}
            {canGiveFeedback && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Feedback</h3>
                <FeedbackForm fromUserId={user.id} toUserId={user.id} canGiveFeedback={canGiveFeedback} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
