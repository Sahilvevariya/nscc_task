// POST /api/admin/login
// Simple admin login using ADMIN_USERNAME & ADMIN_PASSWORD from env
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// For minimal approach we compare env values (suitable for small dev projects).
// If you want to store admin in DB, we can extend later.
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username & password required' });

  const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // produce a token (short expiry)
  const token = jwt.sign({ username }, process.env.JWT_SECRET || 'secret123', { expiresIn: '12h' });
  return res.json({ token });
});

module.exports = router;
