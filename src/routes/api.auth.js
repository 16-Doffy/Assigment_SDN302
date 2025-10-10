const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

const router = express.Router();

// POST /auth/login -> returns JWT
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const member = await Member.findOne({ username });
  if (!member) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, member.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: member._id, username: member.username }, process.env.JWT_SECRET, { expiresIn: '2h' });
  return res.json({ token });
});

module.exports = router;


