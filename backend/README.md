# Pairfect Backend API

Backend API for the Pairfect dating application.

## Features

- User authentication with JWT
- Payment processing for chat access
- Free message tracking with automatic reset
- Subscription management
- Profile management

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Payments
- `GET /api/payments/chat/access` - Check chat access and free messages
- `POST /api/payments/chat/initialize` - Initialize payment for chat access
- `POST /api/payments/chat/verify` - Verify payment and update subscription
- `GET /api/payments/subscription/plans` - Get available subscription plans

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT signing
- `FREE_MESSAGES_LIMIT` - Number of free messages per period
- `FREE_MESSAGES_RESET_HOURS` - Hours before free messages reset

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Chat Access Logic

The `/api/payments/chat/access` endpoint returns:

### For Paid Users:
```json
{
  "hasAccess": true,
  "planType": "daily|monthly",
  "expiryDate": "2024-01-01T00:00:00.000Z",
  "reference": "pay_123456789"
}
```

### For Free Users:
```json
{
  "hasAccess": true|false,
  "planType": "free",
  "freeMessagesRemaining": 3,
  "freeMessagesLimit": 5,
  "nextResetInHours": "12.5"
}
```

## Free Message System

- Free users get a limited number of messages per time period
- Messages reset automatically after the configured time period
- Paid users have unlimited messages during their subscription period

## Database Schema

### User Model
- `email` - User email (unique)
- `password` - Hashed password
- `profile` - User profile information
- `subscription` - Subscription details
- `freeMessages` - Free message tracking
- `isActive` - Account status

## Security

- JWT authentication required for protected routes
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js for security headers
