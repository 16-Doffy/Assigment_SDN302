const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'member', required: true },
    content: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

feedbackSchema.index({ product: 1, member: 1 }, { unique: true });

module.exports = mongoose.model('feedback', feedbackSchema);


