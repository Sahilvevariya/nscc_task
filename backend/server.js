// server.js - Unified entry point for backend API + static frontend
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');

// --- Import API routes ---
const registerRoute = require('./routes/register');
const adminRoute = require('./routes/admin');
const attendanceRoute = require('./routes/attendance');
const exportRoute = require('./routes/export');
const scanRoute = require('./routes/scan');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// --- Connect MongoDB ---
const MONGO = process.env.MONGO_URI;
connectDB(MONGO).catch((err) => {
  console.error('❌ DB connection failed at startup:', err.message);
});

// --- API Routes ---
app.use('/api/register', registerRoute);
app.use('/api/admin', adminRoute);
app.use('/api/attendance', attendanceRoute);
app.use('/api/export', exportRoute);
app.use('/api/scan', scanRoute);

// --- Serve Static Frontend Files ---
const frontendPath = path.join(__dirname, '..', 'frontend');

// Serve CSS, images, etc.
app.use('/assets', express.static(path.join(frontendPath, 'assets')));

// Serve JS files if you have any custom scripts in /js
app.use('/js', express.static(path.join(frontendPath, 'js')));

// Serve individual HTML pages
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(frontendPath, 'register.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(frontendPath, 'admin.html')));
app.get('/attendance.html', (req, res) => res.sendFile(path.join(frontendPath, 'attendance.html')));
app.get('/previousevents.html', (req, res) => res.sendFile(path.join(frontendPath, 'previousevents.html')));
app.get('/home.html', (req, res) => res.sendFile(path.join(frontendPath, 'home.html')));

// --- 404 fallback for invalid frontend routes ---
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
