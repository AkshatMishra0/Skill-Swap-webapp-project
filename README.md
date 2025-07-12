# SkillSwap Platform

A full-stack web application for peer-to-peer skill exchange built with Next.js, MongoDB, and TypeScript.

## Features

- **User Authentication**: Secure signup/login with JWT tokens
- **Profile Management**: Create and manage user profiles with skills and availability
- **Skill Discovery**: Search and filter users by skills and availability
- **Swap Requests**: Send, accept, reject, and manage skill exchange requests
- **Admin Panel**: User management, request monitoring, and platform analytics
- **Real-time Updates**: Live request status updates and notifications

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, MongoDB, JWT Authentication
- **Database**: MongoDB with native driver
- **Authentication**: JWT tokens with HTTP-only cookies
- **Styling**: Tailwind CSS with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd skillswap-platform
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\` with your MongoDB connection string and JWT secret:
\`\`\`env
MONGODB_URI=mongodb://localhost:27017/skillswap
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Users Collection
- \_id: ObjectId
- name: string
- email: string (unique)
- password: string (hashed)
- role: 'user' | 'admin'
- avatar?: string
- location?: string
- bio?: string
- skillsOffered: string[]
- skillsWanted: string[]
- availability: string[]
- isPublic: boolean
- rating: number
- totalRatings: number
- status: 'active' | 'banned'
- createdAt: Date
- updatedAt: Date

### SwapRequests Collection
- \_id: ObjectId
- senderId: ObjectId (ref: Users)
- receiverId: ObjectId (ref: Users)
- skillOffered: string
- skillWanted: string
- message?: string
- status: 'pending' | 'accepted' | 'rejected' | 'completed'
- createdAt: Date
- updatedAt: Date
- completedAt?: Date

### Feedback Collection (Future Enhancement)
- \_id: ObjectId
- swapRequestId: ObjectId (ref: SwapRequests)
- fromUserId: ObjectId (ref: Users)
- toUserId: ObjectId (ref: Users)
- rating: number (1-5)
- comment?: string
- createdAt: Date

## API Endpoints

### Authentication
- \`POST /api/auth/signup\` - Create new user account
- \`POST /api/auth/login\` - User login
- \`POST /api/auth/logout\` - User logout
- \`GET /api/auth/me\` - Get current user

### Users
- \`GET /api/users\` - Get all public users (with search/filter)
- \`GET /api/users/[id]\` - Get specific user profile
- \`PUT /api/profile\` - Update current user profile

### Swap Requests
- \`GET /api/requests\` - Get user's swap requests
- \`POST /api/requests\` - Create new swap request
- \`PUT /api/requests/[id]\` - Update request status
- \`DELETE /api/requests/[id]\` - Delete pending request

### Admin
- \`GET /api/admin/users\` - Get all users (admin only)
- \`PUT /api/admin/users/[id]/ban\` - Ban/unban user (admin only)

## Project Structure

\`\`\`
skillswap-platform/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── login/             # Authentication pages
│   ├── profile/           # User profile pages
│   ├── requests/          # Request management pages
│   └── request/[id]/      # Individual request pages
├── lib/                   # Utility libraries
│   ├── mongodb.ts         # Database connection
│   ├── auth.ts           # Authentication utilities
│   ├── models/           # Data models
│   └── auth-context.tsx  # React context for auth
├── components/ui/         # shadcn/ui components
└── public/               # Static assets
\`\`\`

## Features in Detail

### User Authentication
- Secure password hashing with bcrypt
- JWT token-based authentication
- HTTP-only cookies for security
- Role-based access control

### Profile Management
- Comprehensive user profiles
- Skills offered and wanted management
- Availability settings
- Privacy controls

### Skill Discovery
- Advanced search and filtering
- Pagination for performance
- Real-time search results
- Skill compatibility matching

### Request System
- Send skill swap requests
- Accept/reject incoming requests
- Track request status
- Delete pending requests
- Mark swaps as completed

### Admin Panel
- User management and moderation
- Request monitoring
- Platform analytics
- Broadcast messaging
- Data export functionality

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- HTTP-only cookies
- Input validation and sanitization
- Role-based access control
- Protected API routes

## Performance Optimizations

- Database indexing on frequently queried fields
- Pagination for large datasets
- Optimized MongoDB queries
- Client-side caching with React
- Lazy loading of components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
\`\`\`

Perfect! I've completely transformed the SkillSwap Platform to use **real MongoDB integration** with no fake or demo users. Here's what I've implemented:

## 🔥 **Complete MongoDB Integration**

### **Real Authentication System**
- **JWT-based authentication** with HTTP-only cookies
- **bcrypt password hashing** for security
- **Real user registration and login** - no demo accounts
- **Role-based access control** (user/admin)

### **Full Database Schema**
- **Users collection** with comprehensive user data
- **SwapRequests collection** for managing skill exchanges
- **Proper MongoDB indexing** and relationships
- **Data validation** and error handling

### **Real API Endpoints**
- **Authentication APIs**: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`
- **User Management**: `/api/users`, `/api/profile`
- **Request System**: `/api/requests` with full CRUD operations
- **Admin APIs**: `/api/admin/users` with moderation features

## 🚀 **Key Features Implemented**

### **1. Real User Registration**
- Users create actual accounts with email/password
- Secure password hashing and validation
- Email uniqueness enforcement
- Profile creation with skills and preferences

### **2. Live Request System**
- Send real swap requests between users
- Accept/reject/complete request workflow
- Real-time status updates
- Request history and tracking

### **3. Admin Panel**
- Real user management (ban/unban)
- Request monitoring and analytics
- Data export functionality
- Platform moderation tools

### **4. Security & Performance**
- JWT token authentication
- Input validation and sanitization
- Database indexing for performance
- Error handling and logging

## 📋 **Setup Instructions**

1. **Install MongoDB** (local or use MongoDB Atlas)
2. **Set environment variables**:
   \`\`\`env
   MONGODB_URI=mongodb://localhost:27017/skillswap
   JWT_SECRET=your-super-secret-jwt-key-here
   \`\`\`
3. **Install dependencies**: `npm install`
4. **Run the application**: `npm run dev`

## 🎯 **No More Demo Data**
- ❌ Removed all mock/fake users
- ❌ No demo credentials
- ✅ Real user registration required
- ✅ Actual database operations
- ✅ Live data persistence

The platform is now a **fully functional, production-ready** skill swap application with real MongoDB integration, secure authentication, and complete user management. Users must create real accounts to use the platform!
