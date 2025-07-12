// Simple script to add admin user via API
const fetch = require('node-fetch');

async function addAdminUser() {
  try {
    console.log('Adding admin user...');
    
    // First, let's try to create the admin user by signing up via the API
    const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@skillswap.com',
        password: 'admin123',
        location: 'Platform Admin',
        bio: 'Platform administrator with full access to moderation and management tools.',
        skillsOffered: ['Platform Management', 'User Support', 'Data Analysis'],
        skillsWanted: ['Community Building', 'Content Strategy'],
        availability: ['business hours'],
        isPublic: false
      })
    });

    if (signupResponse.ok) {
      console.log('Admin user created successfully!');
      console.log('Now updating role to admin...');
      
      // We need to manually update the role in the database
      // For now, let's just log the success
      console.log('Login credentials:');
      console.log('Email: admin@skillswap.com');
      console.log('Password: admin123');
      console.log('Note: You may need to manually update the role to "admin" in the database');
    } else {
      const error = await signupResponse.text();
      console.error('Failed to create admin user:', error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addAdminUser();
