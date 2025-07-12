const { MongoClient } = require('mongodb')
require('dotenv').config({ path: '.env.local' })

async function makeAdmin() {
  const client = new MongoClient(process.env.MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('skillswap')
    
    // Update the admin user's role
    const result = await db.collection('users').updateOne(
      { email: 'admin@skillswap.com' },
      { 
        $set: { 
          role: 'admin',
          updatedAt: new Date()
        } 
      }
    )
    
    if (result.matchedCount > 0) {
      console.log('✅ Admin user role updated successfully!')
      console.log('Login with: admin@skillswap.com / admin123')
    } else {
      console.log('❌ Admin user not found')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

makeAdmin()
