const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { ensureAuthenticated } = require('../middleware/authView');
const { requireRole, ROLES } = require('../middleware/authorize');

const router = express.Router();

// Admin-only CRUD for perfumes
router.use(ensureAuthenticated, requireRole('admin'));

router.get('/', async (req, res) => {
  const items = await Product.find().lean();
  res.json(items);
});

router.post('/',
  body('name').isString().trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const doc = await Product.create(req.body);
    res.status(201).json(doc);
  }
);

router.put('/:id', async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const ok = await Product.findByIdAndDelete(req.params.id);
  if (!ok) return res.status(404).json({ message: 'Not found' });
  res.json({ success: true });
});

module.exports = router;


