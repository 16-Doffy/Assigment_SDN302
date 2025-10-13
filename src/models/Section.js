const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    sectionName: { type: String, required: true, trim: true },
    sectionDescription: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 0 },
    isMainTask: { type: Boolean, default: false },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Section', sectionSchema);


