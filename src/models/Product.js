const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  perfumeName: { type: String, required: true, trim: true },
  uri: { type: String, required: true, trim: true }, // image URL
  price: { type: Number, required: true, min: 0 },
  concentration: { type: String, required: true, trim: true }, // Extrait, EDP, EDT, etc.
  description: { type: String, required: true, trim: true },
  ingredients: { type: String, required: true, trim: true },
  volume: { type: Number, required: true, min: 0 }, // volume in ml
  targetAudience: { type: String, required: true, trim: true }, // male, female, unisex
  brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
  comments: [{ 
    rating: { type: Number, min: 1, max: 3, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "Member", required: true }
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'Member' }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);


