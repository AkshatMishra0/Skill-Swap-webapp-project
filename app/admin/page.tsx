"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  Download, 
  MessageSquare, 
  BarChart3, 
  UserX, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  Ban,
  Shield,
  FileText,
  Settings,
  Activity,
  Mail,
  Calendar,
  Star
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  avatar?: string
  location?: string
  skillsOffered: string[]
  skillsWanted: string[]
  rating: number
  createdAt: Date
  totalRatings: number
  completedSwaps?: number
  reviewCount?: number
}

interface SwapRequest {
  id: string
  senderId: string
  receiverId: string
  skillOffered: string
  skillWanted: string
  message: string
  status: string
  createdAt: Date
  updatedAt: Date
  senderName?: string
  receiverName?: string
}

interface Feedback {
  id: string
  fromUserId: string
  toUserId: string
  rating: number
  comment: string
  skill: string
  createdAt: Date
  fromUserName?: string
  toUserName?: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalSwaps: 0,
    completedSwaps: 0,
    pendingSwaps: 0,
    totalFeedback: 0,
    averageRating: 0
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [reportType, setReportType] = useState("users")
  const [dateRange, setDateRange] = useState("all")
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false)

  // Fetch admin data
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "admin") {
      router.push("/")
      return
    }

    fetchAdminData()
  }, [user, router])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      // Fetch users
      const usersRes = await fetch('/api/admin/users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      // Fetch swap requests
      const swapsRes = await fetch('/api/admin/swaps')
      if (swapsRes.ok) {
        const swapsData = await swapsRes.json()
        setSwapRequests(swapsData.swaps || [])
      }

      // Fetch feedback
      const feedbackRes = await fetch('/api/admin/feedback')
      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json()
        setFeedback(feedbackData.feedback || [])
      }

      // Calculate stats
      calculateStats()
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setMessage('Error loading admin data')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === 'active').length
    const bannedUsers = users.filter(u => u.status === 'banned').length
    const totalSwaps = swapRequests.length
    const completedSwaps = swapRequests.filter(r => r.status === 'completed').length
    const pendingSwaps = swapRequests.filter(r => r.status === 'pending').length
    const totalFeedback = feedback.length
    const averageRating = feedback.length > 0 ? 
      feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length : 0

    setStats({
      totalUsers,
      activeUsers,
      bannedUsers,
      totalSwaps,
      completedSwaps,
      pendingSwaps,
      totalFeedback,
      averageRating
    })
  }

  // Re-calculate stats when data changes
  useEffect(() => {
    calculateStats()
  }, [users, swapRequests, feedback])

  if (!user || user.role !== "admin") {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Admin actions
  const handleBanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'banned' } : u))
        setMessage('User banned successfully')
      } else {
        throw new Error('Failed to ban user')
      }
    } catch (error) {
      setMessage('Error banning user')
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u))
        setMessage('User unbanned successfully')
      } else {
        throw new Error('Failed to unban user')
      }
    } catch (error) {
      setMessage('Error unbanning user')
    }
  }

  const handleRejectSkill = async (userId: string, skill: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reject-skill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill })
      })
      
      if (response.ok) {
        setMessage('Skill rejected and removed')
        fetchAdminData() // Refresh data
      } else {
        throw new Error('Failed to reject skill')
      }
    } catch (error) {
      setMessage('Error rejecting skill')
    }
  }

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      setMessage('Please enter a message to broadcast')
      return
    }

    try {
      setIsSendingBroadcast(true)
      const response = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage })
      })
      
      if (response.ok) {
        setMessage('Broadcast message sent successfully')
        setBroadcastMessage('')
      } else {
        throw new Error('Failed to send broadcast')
      }
    } catch (error) {
      setMessage('Error sending broadcast message')
    } finally {
      setIsSendingBroadcast(false)
    }
  }

  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`/api/admin/reports?type=${reportType}&range=${dateRange}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage('Report downloaded successfully')
      } else {
        throw new Error('Failed to download report')
      }
    } catch (error) {
      setMessage('Error downloading report')
    }
  }

  const handleUpdateSwapStatus = async (swapId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/swaps/${swapId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        setSwapRequests(prev => prev.map(r => r.id === swapId ? { ...r, status } : r))
        setMessage(`Swap status updated to ${status}`)
      } else {
        throw new Error('Failed to update swap status')
      }
    } catch (error) {
      setMessage('Error updating swap status')
    }
  }

  const handleFlagFeedback = async (feedbackId: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        setMessage('Feedback flagged successfully')
        fetchAdminData() // Refresh data
      } else {
        throw new Error('Failed to flag feedback')
      }
    } catch (error) {
      setMessage('Error flagging feedback')
    }
  }

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        setFeedback(prev => prev.filter(f => f.id !== feedbackId))
        setMessage('Feedback deleted successfully')
      } else {
        throw new Error('Failed to delete feedback')
      }
    } catch (error) {
      setMessage('Error deleting feedback')
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      banned: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">SkillSwap Admin</h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
          <p className="text-gray-600">Manage users, monitor activity, and oversee the platform</p>
        </div>

        {message && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalSwaps}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Swaps</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.completedSwaps}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="requests">Request Monitoring</TabsTrigger>
            <TabsTrigger value="feedback">Feedback Moderation</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and moderate platform activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={user.status === "banned" ? "destructive" : "default"}>
                              {user.status || "active"}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {user.skillsOffered?.length || 0} skills offered
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {user.status === "banned" ? (
                          <Button size="sm" variant="outline" onClick={() => handleUnbanUser(user.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Unban
                          </Button>
                        ) : (
                          <Button size="sm" variant="destructive" onClick={() => handleBanUser(user.id)}>
                            <UserX className="h-4 w-4 mr-1" />
                            Ban
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Shield className="h-4 w-4 mr-1" />
                              Moderate Skills
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Moderate Skills for {user.name}</DialogTitle>
                              <DialogDescription>
                                Remove inappropriate or spammy skills from this user's profile.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium">Skills Offered:</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {user.skillsOffered?.map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                                      <span>{skill}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-4 w-4 p-0 hover:bg-red-100"
                                        onClick={() => handleRejectSkill(user.id, skill)}
                                      >
                                        ×
                                      </Button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Skills Wanted:</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {user.skillsWanted?.map((skill, index) => (
                                    <Badge key={index} variant="outline" className="flex items-center space-x-1">
                                      <span>{skill}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-4 w-4 p-0 hover:bg-red-100"
                                        onClick={() => handleRejectSkill(user.id, skill)}
                                      >
                                        ×
                                      </Button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Request Monitoring</CardTitle>
                <CardDescription>Monitor and moderate skill swap requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {swapRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{request.senderName}</span>
                          <span className="text-gray-500">→</span>
                          <span className="font-medium">{request.receiverName}</span>
                        </div>
                        <Badge
                          className={
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : request.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>
                          Skill Exchange: <strong>{request.skillOffered}</strong> ↔{" "}
                          <strong>{request.skillWanted}</strong>
                        </p>
                        <p>Date: {new Date(request.createdAt).toLocaleDateString()}</p>
                        {request.message && (
                          <p className="mt-2 p-2 bg-gray-50 rounded text-xs">Message: "{request.message}"</p>
                        )}
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Select 
                          value={request.status} 
                          onValueChange={(newStatus) => handleUpdateSwapStatus(request.id, newStatus)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedUser(null)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Moderation</CardTitle>
                <CardDescription>Review and moderate user feedback and ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{review.fromUserName}</span>
                          <span className="text-gray-500">→</span>
                          <span className="font-medium">{review.toUserName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="outline">{review.rating}/5</Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>
                          Skill: <strong>{review.skill}</strong>
                        </p>
                        <p>Date: {new Date(review.createdAt).toLocaleDateString()}</p>
                        {review.comment && (
                          <div className="mt-2 p-3 bg-gray-50 rounded">
                            <p className="text-sm">"{review.comment}"</p>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (confirm('Are you sure you want to flag this feedback as inappropriate?')) {
                              handleFlagFeedback(review.id)
                            }
                          }}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Flag
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
                              handleDeleteFeedback(review.id)
                            }
                          }}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {feedback.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No feedback to moderate</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Broadcast Message</CardTitle>
                <CardDescription>Send platform-wide announcements to all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="broadcast">Message</Label>
                  <Textarea
                    id="broadcast"
                    placeholder="Enter your announcement message..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleSendBroadcast} disabled={!broadcastMessage.trim() || isSendingBroadcast}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Broadcast
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Download Reports</CardTitle>
                <CardDescription>Export platform data for analysis and record keeping</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">User Report</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Export all user data including profiles, skills, and activity status
                    </p>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger className="w-full mb-2">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="users">Users</SelectItem>
                        <SelectItem value="swaps">Swaps</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-full mb-4">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="quarter">Last Quarter</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleDownloadReport} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Report Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span className="font-medium">{stats.totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Users:</span>
                        <span className="font-medium">{stats.activeUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Swaps:</span>
                        <span className="font-medium">{stats.totalSwaps}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed Swaps:</span>
                        <span className="font-medium">{stats.completedSwaps}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Feedback:</span>
                        <span className="font-medium">{stats.totalFeedback}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Rating:</span>
                        <span className="font-medium">{stats.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
