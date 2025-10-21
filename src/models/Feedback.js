const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedbackSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  member: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  comment: { type: String, required: true, trim: true },
  rating: { type: Number, min: 1, max: 3, default: 3 }, // theo đề: 1..3
}, { timestamps: true });

// mỗi member chỉ được 1 feedback cho 1 product cùng 1 thời điểm
FeedbackSchema.index({ product: 1, member: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);


