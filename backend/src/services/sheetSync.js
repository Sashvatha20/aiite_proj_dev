const express = require('express');
const router = express.Router();

const syncStudentsSheet = require('../services/syncStudentsSheet');
const syncMentorFeedbackSheet = require('../services/syncMentorFeedbackSheet');

router.post('/students', async (req, res) => {
  try {
    const result = await syncStudentsSheet();
    res.json(result);
  } catch (err) {
    console.error('SYNC STUDENTS SHEET ERROR:', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.post('/mentor-feedback', async (req, res) => {
  try {
    const result = await syncMentorFeedbackSheet();
    res.json(result);
  } catch (err) {
    console.error('SYNC MENTOR FEEDBACK SHEET ERROR:', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;