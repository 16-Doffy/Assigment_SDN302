const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memberSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullname: { type: String, trim: true, default: '' },
    birthYear: { type: Number, min: 1900, max: 2100 },
  role: { type: String, enum: ['guest', 'member', 'admin'], default: 'member' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);


