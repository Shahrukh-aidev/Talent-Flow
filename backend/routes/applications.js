// routes/applications.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/mysql');
const { auth, requireRole } = require('../middleware/auth');

// Lazy-load MongoDB model to avoid startup crash if Mongo isn't ready
let Resume;
function getResume() {
  if (!Resume) Resume = require('../models/Resume');
  return Resume;
}

// Lazy-load NLP util
let nlpParser;
function getMatchScore(resumeSkills, jobSkills) {
  if (!nlpParser) nlpParser = require('../utils/nlpParser');
  return nlpParser.calculateMatchScore(resumeSkills, jobSkills);
}

// ─── POST /api/applications — Apply for a job ─────────────
router.post('/', auth, requireRole('seeker'), async (req, res) => {
  try {
    const { job_id, cover_letter } = req.body;
    if (!job_id) {
      return res.status(400).json({ success: false, message: 'job_id is required.' });
    }

    // Check job exists and is open
    const [job] = await db.query(
      "SELECT id, skills_required FROM jobs WHERE id = ? AND status = 'open'",
      [job_id]
    );
    if (!job.length) {
      return res.status(404).json({ success: false, message: 'Job not found or already closed.' });
    }

    // Check already applied
    const [existing] = await db.query(
      'SELECT id FROM applications WHERE job_id = ? AND seeker_id = ?',
      [job_id, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'You have already applied for this job.' });
    }

    // Calculate match score using NLP + MongoDB resume
    let matchScore = 0;
    try {
      const ResumeModel = getResume();
      const resume = await ResumeModel.findOne({ userId: req.user.id }).sort({ uploadedAt: -1 });
      if (resume && resume.parsedData && resume.parsedData.skills && resume.parsedData.skills.length > 0) {
        matchScore = getMatchScore(resume.parsedData.skills, job[0].skills_required);
      }
    } catch (mongoErr) {
      console.warn('Could not fetch resume for match score:', mongoErr.message);
    }

    const [result] = await db.query(
      'INSERT INTO applications (job_id, seeker_id, cover_letter, match_score) VALUES (?, ?, ?, ?)',
      [job_id, req.user.id, cover_letter || '', matchScore]
    );

    res.status(201).json({
      success:       true,
      message:       'Application submitted successfully!',
      applicationId: result.insertId,
      matchScore
    });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── GET /api/applications/my — Seeker's own applications ─
router.get('/my', auth, requireRole('seeker'), async (req, res) => {
  try {
    const [applications] = await db.query(`
      SELECT a.*, j.title AS job_title, j.location, j.job_type,
             j.salary_min, j.salary_max, c.name AS company_name
      FROM applications a
      JOIN jobs j          ON a.job_id    = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE a.seeker_id = ?
      ORDER BY a.applied_at DESC
    `, [req.user.id]);

    res.json({ success: true, applications });
  } catch (err) {
    console.error('My applications error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── GET /api/applications/stats/overview — Dashboard stats
router.get('/stats/overview', auth, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'seeker') {
      const [[total]]       = await db.query('SELECT COUNT(*) AS c FROM applications WHERE seeker_id = ?', [req.user.id]);
      const [[pending]]     = await db.query("SELECT COUNT(*) AS c FROM applications WHERE seeker_id = ? AND status = 'pending'", [req.user.id]);
      const [[accepted]]    = await db.query("SELECT COUNT(*) AS c FROM applications WHERE seeker_id = ? AND status = 'accepted'", [req.user.id]);
      const [[shortlisted]] = await db.query("SELECT COUNT(*) AS c FROM applications WHERE seeker_id = ? AND status = 'shortlisted'", [req.user.id]);
      stats = { total: total.c, pending: pending.c, accepted: accepted.c, shortlisted: shortlisted.c };
    } else {
      const [[jobs]]     = await db.query('SELECT COUNT(*) AS c FROM jobs WHERE recruiter_id = ?', [req.user.id]);
      const [[openJobs]] = await db.query("SELECT COUNT(*) AS c FROM jobs WHERE recruiter_id = ? AND status = 'open'", [req.user.id]);
      const [[apps]]     = await db.query(
        'SELECT COUNT(*) AS c FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = ?',
        [req.user.id]
      );
      stats = { totalJobs: jobs.c, openJobs: openJobs.c, totalApplications: apps.c };
    }

    res.json({ success: true, stats });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── GET /api/applications/job/:jobId — Recruiter view ────
router.get('/job/:jobId', auth, requireRole('recruiter'), async (req, res) => {
  try {
    // Verify recruiter owns this job
    const [job] = await db.query('SELECT recruiter_id FROM jobs WHERE id = ?', [req.params.jobId]);
    if (!job.length || job[0].recruiter_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these applications.' });
    }

    const [applications] = await db.query(`
      SELECT a.*, u.name AS seeker_name, u.email AS seeker_email,
             u.phone AS seeker_phone, u.location AS seeker_location
      FROM applications a
      JOIN users u ON a.seeker_id = u.id
      WHERE a.job_id = ?
      ORDER BY a.match_score DESC, a.applied_at ASC
    `, [req.params.jobId]);

    // Enrich with MongoDB resume data (non-blocking — if Mongo fails, still return apps)
    let enriched = applications;
    try {
      const ResumeModel = getResume();
      enriched = await Promise.all(
        applications.map(async (app) => {
          try {
            const resume = await ResumeModel
              .findOne({ userId: app.seeker_id })
              .select('parsedData.skills parsedData.totalYearsExperience fileName uploadedAt')
              .sort({ uploadedAt: -1 });
            return { ...app, resume: resume || null };
          } catch {
            return { ...app, resume: null };
          }
        })
      );
    } catch (mongoErr) {
      console.warn('MongoDB enrichment failed, returning without resume data:', mongoErr.message);
    }

    res.json({ success: true, applications: enriched });
  } catch (err) {
    console.error('Job applications error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── PUT /api/applications/:id/status — Update status ────
router.put('/:id/status', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Application marked as "${status}".` });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

module.exports = router;
