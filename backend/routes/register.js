// POST /api/register
// Save a participant and return a QR code (data URL) encoding the regId
const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const mongoose = require('mongoose');

// Minimal Participant schema (kept in-route to keep flat)
const ParticipantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  regId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});
const Participant = mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);

router.post('/', async (req, res) => {
  try {
    const { name, email, regId } = req.body;
    if (!name || !email || !regId) return res.status(400).json({ error: 'name, email, regId required' });

    // prevent duplicates
    const exists = await Participant.findOne({ regId });
    if (exists) return res.status(409).json({ error: 'regId already registered' });

    const p = await Participant.create({ name, email, regId });

    // generate a simple QR string — we encode the registration id (so scanning yields the id)
    // optionally encode a link: e.g., `https://<your-frontend>/attendance.html?regId=${regId}`
    const qrContent = regId;
    const dataUrl = await QRCode.toDataURL(qrContent);

    return res.json({ participant: p, qrDataUrl: dataUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
