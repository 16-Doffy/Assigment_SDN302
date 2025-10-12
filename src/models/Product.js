const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true },
  brand: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  category: { type: String, trim: true, default: 'General' },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Member' }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);


