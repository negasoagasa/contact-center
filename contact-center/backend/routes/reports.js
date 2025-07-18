const express = require('express');
const Call = require('../models/Call');
const router = express.Router();
const auth = require('../middleware/auth');

// Generate reports
router.get('/', auth(), async (req, res) => {
  const { period, date } = req.query;
  
  try {
    let startDate, endDate;
    const selectedDate = new Date(date);
    
    switch(period) {
      case 'daily':
        startDate = new Date(selectedDate.setHours(0, 0, 0, 0));
        endDate = new Date(selectedDate.setHours(23, 59, 59, 999));
        break;
      case 'weekly':
        startDate = new Date(selectedDate.setDate(selectedDate.getDate() - selectedDate.getDay()));
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'monthly':
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        break;
      case 'yearly':
        startDate = new Date(selectedDate.getFullYear(), 0, 1);
        endDate = new Date(selectedDate.getFullYear(), 11, 31);
        break;
      default:
        return res.status(400).json({ message: 'Invalid period' });
    }

    const calls = await Call.find({
      timestamp: { $gte: startDate, $lte: endDate }
    });

    res.json({
      title: `${period.charAt(0).toUpperCase() + period.slice(1)} Report for ${formatDate(selectedDate, period)}`,
      calls,
      totalCalls: calls.length,
      solvedCalls: calls.filter(c => c.status === 'solved').length,
      escalatedCalls: calls.filter(c => c.status === 'escalated').length,
      pendingCalls: calls.filter(c => c.status === 'pending').length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

function formatDate(date, period) {
  const options = period === 'yearly' ? { year: 'numeric' } :
                 period === 'monthly' ? { year: 'numeric', month: 'long' } :
                 { year: 'numeric', month: 'short', day: 'numeric' };
  
  return date.toLocaleDateString('en-US', options);
}

module.exports = router;