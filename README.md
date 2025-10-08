# speck-test

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the variables from the email.

## Running the Projects

### Backend (API Server)

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your PostgreSQL database and update the `DATABASE_URL` in your `.env` file (or use the one I provide)

4. Start the development server:

   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:3001`

### Backend Environment Variables

Create a `.env` file in the `frontend/` directory with the variables from the email.

### Frontend (Next.js App)

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## Backend API Endpoints

### Health Check

- `GET /` - API health check and status

### Authentication Routes (`/auth`)

- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback handler
- `POST /auth/refresh` - Refresh JWT access token
- `POST /auth/logout` - Logout user
- `POST /auth/logout-all` - Logout user from all devices (requires authentication)
- `GET /auth/verify` - Verify JWT token (requires authentication)

### Calendar Routes (`/calendar`) - All require authentication

- `GET /calendar/events` - Get calendar events directly from Google Calendar
  - Query params: `days` (optional, default: 30) - Number of days ahead to fetch
- `GET /calendar/events/db` - Get calendar events from local database
- `POST /calendar/events` - Create a new calendar event
- `POST /calendar/sync` - Sync events from Google Calendar to local database
- `GET /calendar/calendars` - Get user's Google calendars

### Authentication

All calendar endpoints require a valid JWT access token in the Authorization header:
Authorization: Bearer <your_jwt_token>

## Features

- **Google OAuth2 Integration**: Secure authentication with Google accounts
- **JWT Authentication**: Access and refresh token management
- **Google Calendar API**: Full calendar integration for reading and creating events
- **Event Synchronization**: Sync Google Calendar events to local database
- **CORS Configuration**: Properly configured for frontend-backend communication

## Development Notes

- Backend runs on port 3001 by default
- Frontend runs on port 3000 by default
- CORS is configured to allow requests between frontend and backend
- JWT tokens have a 30-minute expiry for access tokens and 7-day expiry for refresh tokens
- Google Calendar tokens are encrypted before storage in the database
