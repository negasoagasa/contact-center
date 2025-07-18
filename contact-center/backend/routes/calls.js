const express = require('express');
const Call = require('../models/Call');
const User = require('../models/User');
const router = express.Router();
const auth = require('../middleware/auth');

// Log new call
router.post('/', auth(), async (req, res) => {
  const { 
    customerContact, 
    item, 
    category, 
    description, 
    status, 
    escalatedTo,
    isBackofficeCall 
  } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newCall = new Call({
      agentId: user._id,
      agentName: user.name,
      customerContact,
      item,
      category,
      description,
      status,
      escalatedTo,
      isBackofficeCall: isBackofficeCall || false,
      date: new Date().toISOString().split('T')[0],
      isNewEscalation: status === 'escalated'
    });

    await newCall.save();
    res.status(201).json(newCall);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get calls for dashboard
router.get('/dashboard', auth(), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const calls = await Call.find({ date: today });
    
    res.json({
      totalCalls: calls.length,
      escalatedCalls: calls.filter(c => c.status === 'escalated').length,
      solvedCalls: calls.filter(c => c.status === 'solved').length,
      pendingCalls: calls.filter(c => c.status === 'pending').length,
      abandonedCalls: calls.filter(c => c.status === 'abandoned').length,
      recentCalls: calls.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get calls by status and department
router.get('/department/:department', auth(), async (req, res) => {
  try {
    const calls = await Call.find({ 
      status: { $in: ['escalated', 'pending'] },
      escalatedTo: req.params.department 
    }).sort({ timestamp: -1 });
    
    res.json(calls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get calls for agent
router.get('/agent/:agentId', auth(), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const calls = await Call.find({ 
      agentId: req.params.agentId,
      date: today 
    }).sort({ timestamp: -1 });
    
    res.json(calls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update call status/response
router.put('/:id/respond', auth(), async (req, res) => {
  const { text, status, escalateTo } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const call = await Call.findById(req.params.id);
    if (!call) return res.status(404).json({ message: 'Call not found' });

    // Add response
    call.responses.push({
      userId: user._id,
      userName: user.name,
      department: user.role,
      text,
      forBackoffice: ['backoffice', 'finance', 'digital', 'shareholder'].includes(user.role),
      timestamp: new Date()
    });

    // Update status
    if (status === 'escalated' && escalateTo) {
      call.status = 'escalated';
      call.escalatedTo = escalateTo;
      call.escalationPath.push({
        from: user.role,
        to: escalateTo,
        timestamp: new Date()
      });
    } else {
      call.status = status;
    }

    await call.save();
    res.json(call);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;