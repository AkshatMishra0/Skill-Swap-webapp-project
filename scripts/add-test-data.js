// Simple test script to add sample data
import { MongoClient, ObjectId } from 'mongodb'

const uri = 'mongodb+srv://rudra:rudra@hackathon.tukxxmi.mongodb.net/skillswap?retryWrites=true&w=majority'

async function addTestData() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    const db = client.db('skillswap')
    
    // Get existing users
    const users = await db.collection('users').find({}).toArray()
    console.log('Found users:', users.length)
    
    if (users.length >= 2) {
      // Create a completed swap request between the first two users
      const swapRequest = {
        _id: new ObjectId(),
        senderId: users[0]._id,
        receiverId: users[1]._id,
        skillOffered: 'JavaScript',
        skillWanted: 'Python',
        message: 'Test swap request',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      }
      
      await db.collection('swapRequests').insertOne(swapRequest)
      console.log('Added test swap request')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

addTestData()
