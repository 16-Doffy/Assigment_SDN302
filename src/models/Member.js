const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const memberSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullname: { type: String, trim: true, default: '' },
    birthYear: { type: Number, min: 1900, max: 2100 },
  role: { type: String, enum: ['guest', 'user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);

// Hash password before save if modified
memberSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Hash password on findOneAndUpdate when password is present
memberSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() || {};
  if (!update.password && !(update.$set && update.$set.password)) return next();
  try {
    const plain = update.password || (update.$set ? update.$set.password : undefined);
    if (!plain) return next();
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(plain, salt);
    if (update.password) update.password = hashed;
    if (update.$set && update.$set.password) update.$set.password = hashed;
    next();
  } catch (err) {
    next(err);
  }
});


