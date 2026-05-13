const express = require('express');
const router = express.Router();

const { syncStudentsSheet } = require('../services/syncStudentsSheet');
const { syncBatchesSheet } = require('../services/syncBatchesSheet');
const { syncBatchProgressSheet } = require('../services/syncBatchProgressSheet');
const { syncWorkLogSheet } = require('../services/syncWorkLogSheet');
const { syncMentorFeedbackSheet } = require('../services/syncMentorFeedbackSheet');
const { syncStudentFollowupsSheet } = require('../services/syncStudentFollowupsSheet');
const { syncPlacementsSheet } = require('../services/syncPlacementsSheet');
const { syncEscalationsSheet } = require('../services/syncEscalationsSheet');
const { syncWaterCanSheet } = require('../services/syncWaterCanSheet');

const { syncEnquiriesSheet } = require('../services/syncEnquiriesSheet');
const { syncEnquiryFollowupsSheet } = require('../services/syncEnquiryFollowupsSheet');
const { syncEnquiryDailyCountSheet } = require('../services/syncEnquiryDailyCountSheet');

function getErrorMessage(err) {
  if (!err) return 'Unknown error';
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch (_) {
    return 'Unhandled error';
  }
}

router.post('/students', async (req, res) => {
  try {
    const result = await syncStudentsSheet();
    return res.status(200).json({
      success: true,
      message: 'Students sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Students',
    });
  } catch (err) {
    console.error('Students sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Students sheet sync failed',
      error: getErrorMessage(err),
    });
  }
});

router.post('/batches', async (req, res) => {
  try {
    const result = await syncBatchesSheet();
    return res.status(200).json({
      success: true,
      message: 'Batches sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Batches',
    });
  } catch (err) {
    console.error('Batches sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Batches sheet synced failed',
      error: getErrorMessage(err),
    });
  }
});

router.post('/batch-progress', async (req, res) => {
  try {
    const result = await syncBatchProgressSheet();
    return res.status(200).json({
      success: true,
      message: 'Batch Progress sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Batch Progress',
    });
  } catch (err) {
    console.error('Batch Progress sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Batch Progress sheet sync failed',
      error: getErrorMessage(err),
    });
  }
});

router.post('/worklog', async (req, res) => {
  try {
    const result = await syncWorkLogSheet();
    return res.status(200).json({
      success: true,
      message: 'Work Log sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Work_Log',
    });
  } catch (err) {
    console.error('Work Log sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Work Log sheet sync failed',
      error: getErrorMessage(err),
    });
  }
});

router.post('/mentor-feedback', async (req, res) => {
  try {
    const result = await syncMentorFeedbackSheet();
    return res.status(200).json({
      success: true,
      message: result?.message || 'Mentor feedback sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Mentor_Feedback',
    });
  } catch (err) {
    console.error('Mentor feedback sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Mentor feedback sheet sync failed',
      error: getErrorMessage(err),
    });
  }
});

router.post('/student-followups', async (req, res) => {
  try {
    const result = await syncStudentFollowupsSheet();
    return res.status(200).json({
      success: true,
      message: result?.message || 'Student Followups sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Student_Followups',
    });
  } catch (err) {
    console.error('Student Followups sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Student Followups sheet sync failed',
      error: getErrorMessage(err),
    });
  }
});

router.post('/placements', async (req, res) => {
  try {
    const result = await syncPlacementsSheet();
    return res.status(200).json({
      success: true,
      message: result?.message || 'Placements sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Placements',
    });
  } catch (err) {
    console.error('Placements sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Placements sheet synced failed',
      error: getErrorMessage(err),
    });
  }
});

router.post('/escalations', async (req, res) => {
  try {
    const result = await syncEscalationsSheet();
    return res.status(200).json({
      success: true,
      message: result?.message || 'Escalations sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Escalations',
    });
  } catch (err) {
    console.error('Escalations sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Escalations sheet sync failed',
      error: getErrorMessage(err),
    });
  }
});

router.post('/watercan', async (req, res) => {
  try {
    const result = await syncWaterCanSheet();
    return res.status(200).json({
      success: true,
      message: result?.message || 'Water can sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Water_Can_Log',
    });
  } catch (err) {
    console.error('Water can sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Water can sheet sync failed',
      error: getErrorMessage(err),
    });
  }
});

router.post('/enquiries', async (req, res) => {
  try {
    const result = await syncEnquiriesSheet();
    return res.status(200).json({
      success: true,
      message: result?.message || 'Enquiries sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Enquiries',
    });
  } catch (err) {
    console.error('Enquiries sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Enquiries sheet sync failed',
      error: getErrorMessage(err),
    });
  }
});

router.post('/enquiry-followups', async (req, res) => {
  try {
    const result = await syncEnquiryFollowupsSheet();
    return res.status(200).json({
      success: true,
      message: result?.message || 'Enquiry Followups sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Enquiry_Followups',
    });
  } catch (err) {
    console.error('Enquiry Followups sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Enquiry Followups sheet sync failed',
      error: getErrorMessage(err),
    });
  }
});

router.post('/enquiry-daily-count', async (req, res) => {
  try {
    const result = await syncEnquiryDailyCountSheet();
    return res.status(200).json({
      success: true,
      message: result?.message || 'Enquiry Daily Count sheet synced successfully',
      count: result?.count || 0,
      sheet: result?.sheet || 'Enquiry_Daily_Count',
    });
  } catch (err) {
    console.error('Enquiry Daily Count sheet sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Enquiry Daily Count sheet failed',
      error: getErrorMessage(err),
    });
  }
});

module.exports = router;