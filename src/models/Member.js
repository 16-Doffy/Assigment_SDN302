const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memberSchema = new Schema(
  {
    username: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['guest', 'user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);


