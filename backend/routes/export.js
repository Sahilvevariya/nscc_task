// GET /api/export
// Admin-only export of participants + attendance as XLSX
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const jwt = require('jsonwebtoken');

const Participant = mongoose.models.Participant || mongoose.model('Participant', new mongoose.Schema({
  name: String, email: String, regId: String, createdAt: Date
}));
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', new mongoose.Schema({
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
  timestamp: Date
}));

function verifyAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing Authorization' });
  const token = header.split(' ')[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.get('/', verifyAdmin, async (req, res) => {
  try {
    const participants = await Participant.find().lean();
    const attendance = await Attendance.find().lean();
    const attMap = new Map(attendance.map(a => [String(a.participant), a]));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');
    sheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'RegId', key: 'regId', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Timestamp', key: 'timestamp', width: 25 }
    ];

    participants.forEach(p => {
      const a = attMap.get(String(p._id));
      sheet.addRow({
        name: p.name,
        email: p.email,
        regId: p.regId,
        status: a ? 'Present' : 'Absent',
        timestamp: a ? new Date(a.timestamp).toISOString() : ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
