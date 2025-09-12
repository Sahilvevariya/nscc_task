// GET /api/scan/:regId
// Return participant + attendance status for a given regId (useful for scanner UI)
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Participant = mongoose.models.Participant || mongoose.model('Participant', new mongoose.Schema({
  name: String, email: String, regId: String, createdAt: Date
}));

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', new mongoose.Schema({
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
  timestamp: Date
}));

router.get('/:regId', async (req, res) => {
  try {
    const { regId } = req.params;
    const participant = await Participant.findOne({ regId }).lean();
    if (!participant) return res.status(404).json({ error: 'Not found' });
    const attendance = await Attendance.findOne({ participant: participant._id }).lean();
    return res.json({ participant, attended: !!attendance, timestamp: attendance ? attendance.timestamp : null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
