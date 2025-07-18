const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['admin', 'agent', 'backoffice', 'supervisor', 'finance', 'shareholder', 'digital']
  },
  department: { type: String },
  email: { type: String },
  phone: { type: String },
  created: { type: Date, default: Date.now },
  profile: {
    position: { type: String },
    hireDate: { type: String },
    address: { type: String },
    bio: { type: String }
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);