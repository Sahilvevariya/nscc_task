# Event Attendance (minimal)

## Overview
Simple event registration + attendance system:
- Register participants (server returns QR)
- Admin login (username/password in env)
- Attendance marking via scanner in browser (html5-qrcode)
- Export attendance to XLSX (Excel)

## Prereqs
- Node.js (v16+ recommended)
- MongoDB Atlas (or local MongoDB)

## Quick local run (single server)
1. In `backend/` create `.env` with:
MONGO_URI=<your mongodb atlas connection string>
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
PORT=5000

 