# Backend - event-attendance

## Setup

1. Copy `.env.example` values into `.env` (create one) with:
   - MONGO_URI (Atlas connection string)
   - JWT_SECRET (any secret)
   - ADMIN_USERNAME and ADMIN_PASSWORD (for admin login)

2. Install and run:
    cd backend
    npm install
    npm run dev # nodemon or npm start


3. Backend serves frontend statically at the root; open http://localhost:5000

## Routes
- POST `/api/register` { name, email, regId } => saves participant and returns `{ participant, qrDataUrl }`
- POST `/api/admin/login` { username, password } => returns `{ token }`
- POST `/api/attendance/mark` Authorization: Bearer <token> { regId } => marks attendance
- GET `/api/export` Authorization: Bearer <token> => downloads `attendance.xlsx`
- GET `/api/scan/:regId` => returns participant + attendance status

