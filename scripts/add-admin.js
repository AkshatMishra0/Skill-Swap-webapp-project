const { getDatabase } = require("../lib/mongodb")
const bcrypt = require("bcryptjs")

async function addAdminUser() {
  try {
    const db = await getDatabase()
    
    // Check if admin user already exists
    const existingAdmin = await db.collection("users").findOne({ email: "admin@skillswap.com" })
    
    if (existingAdmin) {
      console.log("Admin user already exists")
      return
    }
    
    // Create admin user
    const adminUser = {
      name: "Admin User",
      email: "admin@skillswap.com",
      password: await bcrypt.hash("admin123", 12),
      role: "admin",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Platform Admin",
      bio: "Platform administrator with full access to moderation and management tools.",
      skillsOffered: ["Platform Management", "User Support", "Data Analysis"],
      skillsWanted: ["Community Building", "Content Strategy"],
      availability: ["business hours"],
      isPublic: false,
      rating: 5.0,
      totalRatings: 0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    await db.collection("users").insertOne(adminUser)
    console.log("Admin user created successfully!")
    console.log("Login credentials:")
    console.log("Email: admin@skillswap.com")
    console.log("Password: admin123")
    
  } catch (error) {
    console.error("Error creating admin user:", error)
  } finally {
    process.exit(0)
  }
}

addAdminUser()
