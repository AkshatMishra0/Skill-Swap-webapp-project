import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  role: "user" | "admin"
  avatar?: string
  location?: string
  bio?: string
  skillsOffered: string[]
  skillsWanted: string[]
  availability: string[]
  isPublic: boolean
  rating: number
  totalRatings: number
  completedSwaps?: number
  reviewCount?: number
  status: "active" | "banned"
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile extends Omit<User, "password"> {
  id: string
}

export interface SwapRequest {
  _id?: ObjectId
  senderId: ObjectId
  receiverId: ObjectId
  skillOffered: string
  skillWanted: string
  message?: string
  status: "pending" | "accepted" | "rejected" | "completed"
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface Feedback {
  _id?: ObjectId
  swapRequestId: ObjectId
  fromUserId: ObjectId
  toUserId: ObjectId
  rating: number
  comment?: string
  createdAt: Date
}
