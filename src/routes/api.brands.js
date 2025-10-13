const express = require('express');
const { body, validationResult } = require('express-validator');
const Brand = require('../models/Brand');
const { ensureAuthenticated } = require('../middleware/authView');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

// Admin-only CRUD for brands
router.use(ensureAuthenticated, requireRole('admin'));

router.get('/', async (req, res) => {
  const items = await Brand.find().lean();
  res.json(items);
});

router.post('/', body('name').trim().notEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const doc = await Brand.create(req.body);
  res.status(201).json(doc);
});

router.put('/:id', async (req, res) => {
  const updated = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const ok = await Brand.findByIdAndDelete(req.params.id);
  if (!ok) return res.status(404).json({ message: 'Not found' });
  res.json({ success: true });
});

module.exports = router;


