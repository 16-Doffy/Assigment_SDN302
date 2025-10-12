const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Course = require('../models/Course');
const Section = require('../models/Section');
const { authenticateJwt } = require('../middleware/authJwt');
const { requirePermission, PERMISSIONS } = require('../middleware/authorize');

const router = express.Router();

// All routes require JWT
router.use(authenticateJwt);

// GET /api/courses
router.get('/', requirePermission(PERMISSIONS.COURSES.VIEW), async (req, res) => {
  const courses = await Course.find().sort({ createdAt: -1 });
  res.json(courses);
});

// GET /api/courses/:id
router.get(
  '/:id',
  requirePermission(PERMISSIONS.COURSES.VIEW),
  param('id').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  }
);

// POST /api/courses
router.post(
  '/',
  requirePermission(PERMISSIONS.COURSES.CREATE),
  body('courseName').isString().trim().notEmpty(),
  body('courseDescription').isString().trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const course = await Course.create({
      courseName: req.body.courseName.trim(),
      courseDescription: req.body.courseDescription.trim(),
    });
    res.status(201).json(course);
  }
);

// PUT /api/courses/:id
router.put(
  '/:id',
  requirePermission(PERMISSIONS.COURSES.UPDATE),
  param('id').isMongoId(),
  body('courseName').optional().isString().trim().notEmpty(),
  body('courseDescription').optional().isString().trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(req.body.courseName ? { courseName: req.body.courseName.trim() } : {}),
          ...(req.body.courseDescription ? { courseDescription: req.body.courseDescription.trim() } : {}),
        },
      },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  }
);

// DELETE /api/courses/:id
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.COURSES.DELETE),
  param('id').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    // Check if any sections reference this course
    const count = await Section.countDocuments({ course: req.params.id });
    if (count > 0) {
      return res.status(400).json({ message: 'Cannot delete course with existing sections' });
    }
    const result = await Course.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Deleted' });
  }
);

module.exports = router;


