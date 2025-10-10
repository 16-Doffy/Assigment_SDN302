const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { ensureAuthenticated } = require('../middleware/authView');
const Section = require('../models/Section');
const Course = require('../models/Course');

const router = express.Router();

router.use(ensureAuthenticated);

// Helpers
function formatTitleCase(value) {
  return value
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// List
router.get('/', async (req, res) => {
  const sections = await Section.find().populate('course').sort({ createdAt: -1 });
  res.render('sections/index', { sections, member: req.session.member });
});

// Create form
router.get('/new', async (req, res) => {
  const courses = await Course.find().sort({ courseName: 1 });
  res.render('sections/new', {
    courses,
    values: { sectionName: '', sectionDescription: '', duration: '', isMainTask: false, course: '' },
    errors: {},
  });
});

// Create submit
router.post(
  '/',
  body('sectionName').matches(/^(?:[A-Z][a-zA-Z0-9]*)(?:\s+[A-Z][a-zA-Z0-9]*)*$/),
  body('sectionDescription').isString().trim().notEmpty(),
  body('duration').isInt({ min: 0 }),
  body('isMainTask').optional().toBoolean(),
  body('course').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    const courses = await Course.find().sort({ courseName: 1 });
    if (!errors.isEmpty()) {
      return res.status(400).render('sections/new', {
        courses,
        values: req.body,
        errors: Object.fromEntries(errors.array().map((e) => [e.path, e.msg])),
      });
    }
    const payload = {
      sectionName: formatTitleCase(req.body.sectionName),
      sectionDescription: req.body.sectionDescription.trim(),
      duration: Number(req.body.duration),
      isMainTask: Boolean(req.body.isMainTask),
      course: req.body.course,
    };
    await Section.create(payload);
    res.redirect('/view/sections');
  }
);

// Edit form
router.get('/:id/edit', async (req, res) => {
  const section = await Section.findById(req.params.id);
  if (!section) return res.redirect('/view/sections');
  const courses = await Course.find().sort({ courseName: 1 });
  res.render('sections/edit', {
    courses,
    values: {
      _id: section._id.toString(),
      sectionName: section.sectionName,
      sectionDescription: section.sectionDescription,
      duration: section.duration,
      isMainTask: section.isMainTask,
      course: section.course?.toString() || '',
    },
    errors: {},
  });
});

// Update submit
router.put(
  '/:id',
  param('id').isMongoId(),
  body('sectionName').matches(/^(?:[A-Z][a-zA-Z0-9]*)(?:\s+[A-Z][a-zA-Z0-9]*)*$/),
  body('sectionDescription').isString().trim().notEmpty(),
  body('duration').isInt({ min: 0 }),
  body('isMainTask').optional().toBoolean(),
  body('course').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    const courses = await Course.find().sort({ courseName: 1 });
    if (!errors.isEmpty()) {
      return res.status(400).render('sections/edit', {
        courses,
        values: { ...req.body, _id: req.params.id },
        errors: Object.fromEntries(errors.array().map((e) => [e.path, e.msg])),
      });
    }
    const payload = {
      sectionName: formatTitleCase(req.body.sectionName),
      sectionDescription: req.body.sectionDescription.trim(),
      duration: Number(req.body.duration),
      isMainTask: Boolean(req.body.isMainTask),
      course: req.body.course,
    };
    await Section.findByIdAndUpdate(req.params.id, payload);
    res.redirect('/view/sections');
  }
);

// Delete with confirmation
router.delete('/:id', async (req, res) => {
  await Section.findByIdAndDelete(req.params.id);
  res.redirect('/view/sections');
});

module.exports = router;


