"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import FeedbackForm from "@/components/feedback-form"
import { Loader2, Star, Users, ArrowRight, MapPin, Clock, Mail, Calendar, Award, MessageCircle, ThumbsUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [canGiveFeedback, setCanGiveFeedback] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [error, setError] = useState("")
  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      const resolvedParams = await params
      const { userId } = resolvedParams
      setUserId(userId)
      try {
        const res = await fetch(`/api/users/${userId}`)
        if (!res.ok) throw new Error("User not found")
        const data = await res.json()
        if (isMounted) {
          setUser(data.user)
          setSkills(data.user.skillsOffered || [])
          // Set additional user data from the API response
          console.log("User profile data:", data.user) // Debug log to see what data we're getting
        }
        
        // Fetch reviews for this user
        try {
          const reviewsRes = await fetch(`/api/feedback?userId=${userId}`)
          if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json()
            if (isMounted) setReviews(reviewsData.feedback || [])
          }
        } catch (err) {
          console.error("Error fetching reviews:", err)
        } finally {
          if (isMounted) setReviewsLoading(false)
        }
        // Check if current user can leave feedback
        if (currentUser && currentUser.id !== userId) {
          let canLeave = false
          try {
            const feedbackRes = await fetch(`/api/feedback/can-leave?targetId=${userId}`)
            if (feedbackRes.ok) {
              const feedbackData = await feedbackRes.json()
              canLeave = feedbackData.canLeave
            }
          } catch (err) {
            console.error("Error checking feedback eligibility:", err)
          }
          if (isMounted) setCanGiveFeedback(canLeave)
        }
      } catch (err: any) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [params, currentUser])

  if (loading) return <Loader2 className="h-8 w-8 animate-spin" />
  if (error || !user) return <div className="text-red-600">{error || "Error loading user"}</div>

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Main Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-24 w-24 mx-auto md:mx-0">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="text-xl">{user.name.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <CardTitle className="text-2xl mb-2">{user.name}</CardTitle>
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                {user.location && (
                  <div className="flex items-center justify-center md:justify-start text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center justify-center md:justify-start text-gray-600">
                    <Mail className="h-4 w-4 mr-1" />
                    <span>{user.email}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center md:justify-start mb-3">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium text-lg">{user.rating ? `${user.rating.toFixed(1)} / 5` : "No ratings yet"}</span>
                {user.reviewCount && (
                  <span className="text-gray-500 ml-1">({user.reviewCount} reviews)</span>
                )}
              </div>
              <div className="flex items-center justify-center md:justify-start text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Skills Offered */}
            <div>
              <div className="flex items-center mb-3">
                <Award className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-lg">Skills Offered</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.skillsOffered && user.skillsOffered.length > 0 ? (
                  user.skillsOffered.map((skill: string) => (
                    <Badge key={skill} variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No skills offered yet</span>
                )}
              </div>
            </div>

            {/* Skills Wanted */}
            <div>
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-lg">Skills Wanted</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.skillsWanted && user.skillsWanted.length > 0 ? (
                  user.skillsWanted.map((skill: string) => (
                    <Badge key={skill} variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No skills wanted specified</span>
                )}
              </div>
            </div>
          </div>

          {/* Availability */}
          {user.availability && user.availability.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center mb-3">
                <Clock className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-lg">Availability</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.availability.map((time: string) => (
                  <Badge key={time} variant="secondary" className="bg-purple-100 text-purple-800">
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Bio/Description */}
          {user.bio && (
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-3">About</h3>
              <p className="text-gray-700 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{user.completedSwaps || 0}</div>
              <div className="text-sm text-gray-600">Completed Swaps</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{user.skillsOffered?.length || 0}</div>
              <div className="text-sm text-gray-600">Skills Offered</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{user.skillsWanted?.length || 0}</div>
              <div className="text-sm text-gray-600">Skills Wanted</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{user.reviewCount || 0}</div>
              <div className="text-sm text-gray-600">Reviews</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Request Swap Card */}
        {currentUser && currentUser.id !== user.id && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-xl">Ready to learn?</CardTitle>
              </div>
              <CardDescription>
                Request a skill swap with {user.name} and start learning together!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/request/${user.id}`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Users className="h-4 w-4 mr-2" />
                  Request Skill Swap
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Login Card for non-logged-in users */}
        {!currentUser && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-xl">Want to connect?</CardTitle>
              </div>
              <CardDescription>
                Login to request a skill swap with {user.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button className="w-full" variant="outline">
                  Login to Request Swap
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Feedback Card */}
        {canGiveFeedback && currentUser && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-xl">Leave a Review</CardTitle>
              </div>
              <CardDescription>
                Rate and review your skill swap experience with {user.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackForm 
                fromUserId={currentUser.id}
                toUserId={user.id}
                canGiveFeedback={true}
                toUserName={user.name}
                skills={skills}
              />
            </CardContent>
          </Card>
        )}

        {/* Quick Rating Card - Show if user has completed swaps but hasn't left feedback */}
        {currentUser && currentUser.id !== user.id && !canGiveFeedback && (
          <Card className="opacity-75">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-gray-400" />
                <CardTitle className="text-xl text-gray-600">Review {user.name}</CardTitle>
              </div>
              <CardDescription>
                Complete a skill swap with {user.name} to leave a review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Reviews are available after completing a skill swap
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reviews Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl">Reviews & Testimonials</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-bold text-lg">{user.rating ? user.rating.toFixed(1) : '0.0'}</span>
              </div>
              <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
            </div>
          </div>
          <CardDescription>
            What others are saying about {user.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading reviews...</span>
            </div>
          ) : reviews.length > 0 ? (
            <>
              {/* Rating Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Rating Breakdown</h4>
                  <div className="flex items-center space-x-1">
                    {[1,2,3,4,5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= (user.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Average Rating:</span>
                    <span className="font-semibold ml-2">{user.rating ? user.rating.toFixed(1) : '0.0'}/5</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Reviews:</span>
                    <span className="font-semibold ml-2">{reviews.length}</span>
                  </div>
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-4">
                {reviews.map((review: any, index: number) => (
                  <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.fromUser?.avatar || "/placeholder.svg"} alt={review.fromUser?.name || "Anonymous"} />
                        <AvatarFallback>
                          {review.fromUser?.name?.split(" ").map((n: string) => n[0]).join("") || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{review.fromUser?.name || "Anonymous"}</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        {review.skill && (
                          <div className="mb-2">
                            <Badge variant="outline" className="text-xs">
                              Skill: {review.skill}
                            </Badge>
                          </div>
                        )}
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {review.comment || "No comment provided"}
                        </p>
                        {review.rating >= 4 && (
                          <div className="flex items-center mt-2">
                            <ThumbsUp className="h-3 w-3 text-green-600 mr-1" />
                            <span className="text-xs text-green-600 font-medium">Recommended</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No reviews yet</p>
              <p className="text-sm text-gray-400 mb-4">Be the first to leave a review for {user.name}!</p>
              {currentUser && currentUser.id !== user.id && (
                <div className="text-center">
                  <Link href={`/request/${user.id}`}>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Request Skill Swap
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
