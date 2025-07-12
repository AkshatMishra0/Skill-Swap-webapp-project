// Test script to set up data for testing review functionality
import { MongoClient, ObjectId } from 'mongodb'

const uri = 'mongodb+srv://rudra:rudra@hackathon.tukxxmi.mongodb.net/skillswap?retryWrites=true&w=majority'

async function setupReviewTestData() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    const db = client.db('skillswap')
    
    console.log('Setting up test data for review functionality...')
    
    // Get existing users
    const users = await db.collection('users').find({}).toArray()
    console.log(`Found ${users.length} users`)
    
    if (users.length < 2) {
      console.log('Need at least 2 users to create test swaps')
      return
    }
    
    // Clear existing swap requests and feedback for clean testing
    await db.collection('swapRequests').deleteMany({})
    await db.collection('feedback').deleteMany({})
    console.log('Cleared existing swap requests and feedback')
    
    // Create multiple completed swap requests between different users
    const swapRequests = []
    
    // Create completed swap: User 1 → User 2
    if (users.length >= 2) {
      swapRequests.push({
        _id: new ObjectId(),
        senderId: users[0]._id,
        receiverId: users[1]._id,
        skillOffered: 'JavaScript',
        skillWanted: 'Python',
        message: 'Would love to learn Python from you!',
        status: 'completed',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      })
    }
    
    // Create completed swap: User 2 → User 1
    if (users.length >= 2) {
      swapRequests.push({
        _id: new ObjectId(),
        senderId: users[1]._id,
        receiverId: users[0]._id,
        skillOffered: 'Python',
        skillWanted: 'React',
        message: 'Looking to learn React development',
        status: 'completed',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      })
    }
    
    // Create completed swap: User 1 → User 3 (if exists)
    if (users.length >= 3) {
      swapRequests.push({
        _id: new ObjectId(),
        senderId: users[0]._id,
        receiverId: users[2]._id,
        skillOffered: 'React',
        skillWanted: 'Node.js',
        message: 'Want to learn backend development',
        status: 'completed',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      })
    }
    
    // Add some pending requests for variety
    if (users.length >= 2) {
      swapRequests.push({
        _id: new ObjectId(),
        senderId: users[1]._id,
        receiverId: users[0]._id,
        skillOffered: 'Node.js',
        skillWanted: 'Vue.js',
        message: 'Interested in learning Vue.js',
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      })
    }
    
    // Insert all swap requests
    if (swapRequests.length > 0) {
      await db.collection('swapRequests').insertMany(swapRequests)
      console.log(`Added ${swapRequests.length} swap requests`)
    }
    
    // Add some sample feedback/reviews
    const feedback = []
    
    // User 2 reviews User 1 (positive review)
    if (users.length >= 2) {
      feedback.push({
        fromUserId: users[1]._id.toString(),
        toUserId: users[0]._id.toString(),
        rating: 5,
        comment: 'Excellent teacher! Really helped me understand JavaScript concepts clearly. Very patient and knowledgeable.',
        skill: 'JavaScript',
        swapRequestId: swapRequests[0]._id.toString(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      })
    }
    
    // User 3 reviews User 1 (good review)
    if (users.length >= 3) {
      feedback.push({
        fromUserId: users[2]._id.toString(),
        toUserId: users[0]._id.toString(),
        rating: 4,
        comment: 'Great React session! Good explanations and practical examples.',
        skill: 'React',
        swapRequestId: swapRequests[2]._id.toString(),
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      })
    }
    
    // Insert feedback
    if (feedback.length > 0) {
      await db.collection('feedback').insertMany(feedback)
      console.log(`Added ${feedback.length} feedback entries`)
      
      // Update user ratings
      for (const user of users) {
        const userFeedback = await db.collection('feedback').find({ 
          toUserId: user._id.toString() 
        }).toArray()
        
        if (userFeedback.length > 0) {
          const totalRating = userFeedback.reduce((sum, f) => sum + f.rating, 0)
          const avgRating = totalRating / userFeedback.length
          
          await db.collection('users').updateOne(
            { _id: user._id },
            { 
              $set: { 
                rating: avgRating, 
                reviewCount: userFeedback.length 
              } 
            }
          )
        }
      }
      console.log('Updated user ratings')
    }
    
    // Print summary
    console.log('\n=== TEST DATA SUMMARY ===')
    console.log('✅ Completed swap requests created')
    console.log('✅ Sample reviews added')
    console.log('✅ User ratings updated')
    console.log('\nNow you can:')
    console.log('1. Login as any user')
    console.log('2. Visit other users\' profiles')
    console.log('3. See existing reviews')
    console.log('4. Leave new reviews for completed swaps')
    console.log('\nUsers available:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Rating: ${user.rating || 'No rating'}`)
    })
    
  } catch (error) {
    console.error('Error setting up test data:', error)
  } finally {
    await client.close()
  }
}

setupReviewTestData()
