const express = require('express');
const bcrypt = require('bcryptjs');
const Member = require('../models/Member');

const router = express.Router();

router.get('/signin', (req, res) => {
  res.render('auth/signin', { error: null, username: '' });
});

router.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  const member = await Member.findOne({ username });
  if (!member) return res.render('auth/signin', { error: 'Invalid credentials', username });
  const ok = await bcrypt.compare(password, member.password);
  if (!ok) return res.render('auth/signin', { error: 'Invalid credentials', username });

  // lưu cả hai để các middleware khác tương thích
  req.session.userId = member._id.toString();
  req.session.member = { id: member._id.toString(), username: member.username, role: member.role };

  res.redirect('/dashboard');
});

router.post('/signout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/signin');
  });
});

module.exports = router;


