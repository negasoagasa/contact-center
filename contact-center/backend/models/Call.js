const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentName: { type: String, required: true },
  customerContact: { type: String, required: true },
  item: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['new', 'pending', 'solved', 'escalated', 'abandoned']
  },
  escalatedTo: { type: String },
  notificationShown: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  date: { type: String, required: true },
  isBackofficeCall: { type: Boolean, default: false },
  isNewEscalation: { type: Boolean, default: false },
  responses: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    department: { type: String },
    text: { type: String },
    timestamp: { type: Date, default: Date.now },
    forBackoffice: { type: Boolean }
  }],
  escalationPath: [{
    from: { type: String },
    to: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Call', CallSchema);