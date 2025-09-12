// POST /api/attendance/mark
// Require admin token; mark attendance for a regId (no duplicates)
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Attendance and Participant schemas (simple & local)
const ParticipantSchema = new mongoose.Schema({
  name: String, email: String, regId: { type: String, unique: true }, createdAt: Date
});
const Participant = mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);

const AttendanceSchema = new mongoose.Schema({
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
  timestamp: { type: Date, default: Date.now }
});
AttendanceSchema.index({ participant: 1 }, { unique: true }); // prevent duplicates
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

// simple middleware to verify admin token
function verifyAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing Authorization' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Invalid Authorization' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.post('/mark', verifyAdmin, async (req, res) => {
  try {
    const { regId } = req.body;
    if (!regId) return res.status(400).json({ error: 'regId required' });

    const participant = await Participant.findOne({ regId });
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    const already = await Attendance.findOne({ participant: participant._id });
    if (already) return res.status(409).json({ error: 'Attendance already marked' });

    const att = await Attendance.create({ participant: participant._id });
    return res.json({ ok: true, attendance: att });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
