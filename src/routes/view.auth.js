const express = require('express');
const bcrypt = require('bcryptjs');
const Member = require('../models/Member');

const router = express.Router();

router.get('/signin', (req, res) => {
  res.render('auth/signin', { error: null, username: '' });
});

// Register page
router.get('/register', (req, res) => {
  res.render('auth/register', { error: null, formData: {} });
});

// Handle register
router.post('/register', async (req, res) => {
  try {
    const { username, password, fullname, birthYear } = req.body;
    if (!username || !password) {
      return res.render('auth/register', { error: 'Username và password là bắt buộc', formData: req.body });
    }
    const exists = await Member.findOne({ username });
    if (exists) return res.render('auth/register', { error: 'Username đã tồn tại', formData: req.body });
    const hash = await bcrypt.hash(password, 10);
    const user = await Member.create({ username, password: hash, fullname: fullname || '', birthYear: birthYear ? parseInt(birthYear,10) : undefined, role: 'user' });
    // auto login
    req.session.userId = user._id.toString();
    req.session.member = { id: user._id.toString(), username: user.username, role: user.role, fullname: user.fullname || '', birthYear: user.birthYear || null };
    return res.redirect('/products');
  } catch (e) {
    return res.render('auth/register', { error: 'Đăng ký thất bại', formData: req.body });
  }
});

router.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  const member = await Member.findOne({ username });
  if (!member) return res.render('auth/signin', { error: 'Invalid credentials', username });
  if (member.role === 'guest') {
    return res.render('auth/signin', { error: 'Guest accounts cannot sign in. Please register or contact admin.', username });
  }
  const ok = await bcrypt.compare(password, member.password);
  if (!ok) return res.render('auth/signin', { error: 'Invalid credentials', username });

  // Block guest accounts from logging in per assignment rules
  // already handled above

  // Normalize legacy role 'member' -> 'user'
  if (member.role === 'member') {
    member.role = 'user';
    try { await Member.findByIdAndUpdate(member._id, { role: 'user' }); } catch (_) {}
  }

  // lưu cả hai để các middleware khác tương thích
  req.session.userId = member._id.toString();
  req.session.member = {
    id: member._id.toString(),
    username: member.username,
    role: member.role,
    fullname: member.fullname || '',
    birthYear: member.birthYear || null
  };

  // Redirect based on role: admin -> dashboard; others -> sections
  if (member.role === 'admin') {
    return res.redirect('/dashboard');
  }
  // Non-admins land on products page
  return res.redirect('/products');
});

router.post('/signout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/signin');
  });
});

module.exports = router;


