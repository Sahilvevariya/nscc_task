const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Participant schema
const Participant = mongoose.models.Participant || mongoose.model(
  'Participant',
  new mongoose.Schema({
    name: String,
    email: String,
    regId: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now }
  })
);

// Attendance schema
const Attendance = mongoose.models.Attendance || mongoose.model(
  'Attendance',
  new mongoose.Schema({
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
    timestamp: { type: Date, default: Date.now }
  })
);

// ✅ Get participant by regId
router.get('/:regId', async (req, res) => {
  try {
    const { regId } = req.params;
    const participant = await Participant.findOne({ regId }).lean();
    if (!participant) return res.status(404).json({ error: 'Not found' });

    const attendance = await Attendance.findOne({ participant: participant._id }).lean();
    return res.json({
      participant,
      attended: !!attendance,
      timestamp: attendance ? attendance.timestamp : null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ✅ New route: Get all participants with attendance
router.get('/all/participants', async (req, res) => {
  try {
    const participants = await Participant.find().sort({ createdAt: -1 }).lean();

    const result = await Promise.all(participants.map(async (p) => {
      const att = await Attendance.findOne({ participant: p._id }).lean();
      return {
        name: p.name,
        email: p.email,
        regId: p.regId,
        attended: !!att,
        timestamp: att ? att.timestamp : null
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
