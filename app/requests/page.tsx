
  "use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Clock, CheckCircle, XCircle, Trash2, Star, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface SwapRequest {
  id: string
  senderId: string
  receiverId: string
  senderName: string
  receiverName: string
  senderAvatar?: string
  receiverAvatar?: string
  skillOffered: string
  skillWanted: string
  message?: string
  status: "pending" | "accepted" | "rejected" | "completed"
  createdAt: string
  completedAt?: string
}

export default function RequestsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<SwapRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else {
        fetchRequests()
      }
    }
  }, [user, authLoading, router])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/requests")
      const data = await response.json()

      if (response.ok) {
        setRequests(data.requests)
        setError("")
      } else {
        setError(data.error || "Failed to fetch requests")
      }
    } catch (err) {
      setError("Failed to fetch requests")
      console.error("Error fetching requests:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRequest = async (requestId: string, status: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (response.ok) {
        setRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, status: status as any } : req)))
        setMessage(`Request ${status} successfully!`)
      } else {
        setError(data.error || `Failed to ${status} request`)
      }
    } catch (err) {
      setError(`Failed to ${status} request`)
      console.error(`Error ${status} request:`, err)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        setRequests((prev) => prev.filter((req) => req.id !== requestId))
        setMessage("Request deleted successfully!")
      } else {
        setError(data.error || "Failed to delete request")
      }
    } catch (err) {
      setError("Failed to delete request")
      console.error("Error deleting request:", err)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const sentRequests = requests.filter((req) => req.senderId === user.id)
  const receivedRequests = requests.filter((req) => req.receiverId === user.id)
  const completedSwaps = requests.filter(
    (req) => (req.senderId === user.id || req.receiverId === user.id) && req.status === "completed",
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
              <Link href="/profile">
                <Button variant="ghost">Profile</Button>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Swap Requests</h2>
          <p className="text-gray-600">Manage your skill swap requests and connections</p>
        </div>

        {message && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="received" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="received">Received ({receivedRequests.length})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({sentRequests.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedSwaps.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {receivedRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No requests received yet</p>
                </CardContent>
              </Card>
            ) : (
              receivedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.senderAvatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {request.senderName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{request.senderName}</CardTitle>
                          <CardDescription>
                            Wants to learn <strong>{request.skillOffered}</strong> in exchange for{" "}
                            <strong>{request.skillWanted}</strong>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.message && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">"{request.message}"</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                      {request.status === "pending" && (
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleUpdateRequest(request.id, "accepted")}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateRequest(request.id, "rejected")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {request.status === "accepted" && (
                        <Button size="sm" onClick={() => handleUpdateRequest(request.id, "completed")}>
                          Mark as Completed
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No requests sent yet</p>
                  <Link href="/">
                    <Button className="mt-4">Browse Skills</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              sentRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.receiverAvatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {request.receiverName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{request.receiverName}</CardTitle>
                          <CardDescription>
                            You offered <strong>{request.skillOffered}</strong> to learn{" "}
                            <strong>{request.skillWanted}</strong>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                        {request.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => handleDeleteRequest(request.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.message && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">Your message: "{request.message}"</p>
                      </div>
                    )}
                    <span className="text-sm text-gray-500">
                      Sent {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedSwaps.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No completed swaps yet</p>
                </CardContent>
              </Card>
            ) : (
              completedSwaps.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={request.senderId === user.id ? request.receiverAvatar : request.senderAvatar}
                          />
                          <AvatarFallback>
                            {(request.senderId === user.id ? request.receiverName : request.senderName)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {request.senderId === user.id ? request.receiverName : request.senderName}
                          </CardTitle>
                          <CardDescription>
                            Skill swap: <strong>{request.skillOffered}</strong> ↔ <strong>{request.skillWanted}</strong>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Completed {new Date(request.completedAt || request.createdAt).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="outline">
                        <Star className="h-4 w-4 mr-1" />
                        Leave Feedback
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
