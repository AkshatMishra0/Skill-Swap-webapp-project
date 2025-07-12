import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getDatabase } from "./mongodb"
import type { User, UserProfile } from "./models/User"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function createUser(userData: {
  name: string
  email: string
  password: string
}): Promise<UserProfile | null> {
  try {
    const db = await getDatabase()
    const users = db.collection<User>("users")

    const existingUser = await users.findOne({ email: userData.email.toLowerCase() })
    if (existingUser) {
      return null
    }

    const hashedPassword = await hashPassword(userData.password)

    const newUser: User = {
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: "user",
      skillsOffered: [],
      skillsWanted: [],
      availability: [],
      isPublic: true,
      rating: 0,
      totalRatings: 0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await users.insertOne(newUser)

    const userProfile: UserProfile = {
      id: result.insertedId.toString(),
      ...newUser,
      _id: result.insertedId,
    }

    delete (userProfile as any).password
    return userProfile
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

export async function authenticateUser(email: string, password: string): Promise<UserProfile | null> {
  try {
    const db = await getDatabase()
    const users = db.collection<User>("users")

    const user = await users.findOne({ email: email.toLowerCase() })
    if (!user) {
      return null
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return null
    }

    const userProfile: UserProfile = {
      id: user._id!.toString(),
      ...user,
    }

    delete (userProfile as any).password
    return userProfile
  } catch (error) {
    console.error("Error authenticating user:", error)
    return null
  }
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const db = await getDatabase()
    const users = db.collection<User>("users")

    const user = await users.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return null
    }

    const userProfile: UserProfile = {
      id: user._id!.toString(),
      ...user,
    }

    delete (userProfile as any).password
    return userProfile
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

export async function updateUser(userId: string, updateData: Partial<User>): Promise<UserProfile | null> {
  try {
    const db = await getDatabase()
    const users = db.collection<User>("users")

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result) {
      return null
    }

    const userProfile: UserProfile = {
      id: result._id!.toString(),
      ...result,
    }

    delete (userProfile as any).password
    return userProfile
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}
