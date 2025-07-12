import { getDatabase } from "../lib/mongodb.js"
import { mockUsers } from "../lib/mock-data.js"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

async function resetDatabase() {
  try {
    const db = await getDatabase()
    
    // Clear existing collections
    console.log("Clearing existing collections...")
    await db.collection("users").deleteMany({})
    await db.collection("swapRequests").deleteMany({})
    await db.collection("feedback").deleteMany({})
    
    // Insert sample users
    console.log("Inserting sample users...")
    const usersToInsert = await Promise.all(
      mockUsers.map(async (user) => ({
        _id: new ObjectId(),
        name: user.name,
        email: user.email,
        password: await bcrypt.hash("password123", 12),
        role: user.role,
        avatar: user.avatar,
        location: user.location,
        bio: user.bio,
        skillsOffered: user.skillsOffered,
        skillsWanted: user.skillsWanted,
        availability: user.availability,
        isPublic: user.isPublic,
        rating: user.rating,
        totalRatings: 0,
        status: user.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    )
    
    const insertedUsers = await db.collection("users").insertMany(usersToInsert)
    console.log(`Inserted ${insertedUsers.insertedCount} users`)
    
    // Create sample swap requests
    console.log("Creating sample swap requests...")
    const userIds = Object.values(insertedUsers.insertedIds)
    const sampleRequests = [
      {
        _id: new ObjectId(),
        senderId: userIds[0],
        receiverId: userIds[1],
        skillOffered: "JavaScript",
        skillWanted: "UI/UX Design",
        message: "Hi! I'd love to learn design from you while teaching JavaScript.",
        status: "completed",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        _id: new ObjectId(),
        senderId: userIds[1],
        receiverId: userIds[2],
        skillOffered: "Photography",
        skillWanted: "Spanish",
        message: "I'd love to exchange photography skills for Spanish lessons!",
        status: "completed",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        _id: new ObjectId(),
        senderId: userIds[2],
        receiverId: userIds[0],
        skillOffered: "Digital Marketing",
        skillWanted: "React",
        message: "Looking to learn React while sharing my marketing expertise.",
        status: "pending",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ]
    
    await db.collection("swapRequests").insertMany(sampleRequests)
    console.log(`Created ${sampleRequests.length} sample swap requests`)
    
    // Create sample feedback
    console.log("Creating sample feedback...")
    const sampleFeedback = [
      {
        _id: new ObjectId(),
        swapRequestId: sampleRequests[0]._id,
        fromUserId: userIds[0],
        toUserId: userIds[1],
        rating: 5,
        comment: "Marcus is an excellent teacher! His design explanations were clear and helpful.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        _id: new ObjectId(),
        swapRequestId: sampleRequests[1]._id,
        fromUserId: userIds[1],
        toUserId: userIds[2],
        rating: 4,
        comment: "Elena is a patient and skilled Spanish teacher. Great experience!",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ]
    
    await db.collection("feedback").insertMany(sampleFeedback)
    console.log(`Created ${sampleFeedback.length} sample feedback entries`)
    
    console.log("Database reset completed successfully!")
    console.log("Sample login credentials:")
    console.log("Email: sarah@example.com, Password: password123")
    console.log("Email: marcus@example.com, Password: password123")
    console.log("Email: elena@example.com, Password: password123")
    
  } catch (error) {
    console.error("Error resetting database:", error)
  } finally {
    process.exit(0)
  }
}

resetDatabase()
