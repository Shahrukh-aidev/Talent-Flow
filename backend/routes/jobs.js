// routes/jobs.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/mysql');
const { auth, requireRole } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────
// IMPORTANT: Specific routes MUST come before /:id routes
// Otherwise Express matches "recruiter" as an :id param
// ─────────────────────────────────────────────────────────

// ─── GET /api/jobs/recruiter/my ── Recruiter's own jobs ──
// THIS MUST BE BEFORE GET /:id
router.get('/recruiter/my', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const [jobs] = await db.query(`
      SELECT j.*, c.name AS company_name,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE j.recruiter_id = ?
      ORDER BY j.posted_at DESC
    `, [req.user.id]);

    res.json({ success: true, jobs });
  } catch (err) {
    console.error('My jobs error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── GET /api/jobs ── All open jobs (public) ──────────────
router.get('/', async (req, res) => {
  try {
    const { search, location, type, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT j.*, u.name AS recruiter_name, c.name AS company_name, c.industry
      FROM jobs j
      LEFT JOIN users u     ON j.recruiter_id = u.id
      LEFT JOIN companies c ON j.company_id   = c.id
      WHERE j.status = 'open'
    `;
    const params = [];

    if (search) {
      query += ' AND (j.title LIKE ? OR j.description LIKE ? OR j.skills_required LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (location) {
      query += ' AND j.location LIKE ?';
      params.push(`%${location}%`);
    }
    if (type) {
      query += ' AND j.job_type = ?';
      params.push(type);
    }

    query += ' ORDER BY j.posted_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [jobs] = await db.query(query, params);

    // Count total for pagination
    let countQuery = "SELECT COUNT(*) AS total FROM jobs j WHERE j.status = 'open'";
    const countParams = [];
    if (search) {
      countQuery += ' AND (j.title LIKE ? OR j.description LIKE ? OR j.skills_required LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (location) {
      countQuery += ' AND j.location LIKE ?';
      countParams.push(`%${location}%`);
    }
    if (type) {
      countQuery += ' AND j.job_type = ?';
      countParams.push(type);
    }

    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({
      success: true,
      jobs,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── GET /api/jobs/:id ── Single job details ──────────────
router.get('/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID.' });
    }

    const [rows] = await db.query(`
      SELECT j.*, u.name AS recruiter_name, u.email AS recruiter_email,
             c.name AS company_name, c.industry, c.website,
             c.description AS company_description
      FROM jobs j
      LEFT JOIN users u     ON j.recruiter_id = u.id
      LEFT JOIN companies c ON j.company_id   = c.id
      WHERE j.id = ?
    `, [jobId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    res.json({ success: true, job: rows[0] });
  } catch (err) {
    console.error('Get job by id error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── POST /api/jobs ── Create job (recruiter only) ────────
router.post('/', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const {
      company_id, title, description, location,
      job_type, salary_min, salary_max,
      skills_required, experience_years, deadline
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const [result] = await db.query(`
      INSERT INTO jobs
        (recruiter_id, company_id, title, description, location, job_type,
         salary_min, salary_max, skills_required, experience_years, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      company_id  || null,
      title,
      description,
      location    || '',
      job_type    || 'full-time',
      salary_min  || null,
      salary_max  || null,
      skills_required  || '',
      experience_years || 0,
      deadline    || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Job posted successfully!',
      jobId:   result.insertId
    });
  } catch (err) {
    console.error('Post job error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── PUT /api/jobs/:id ── Update job ──────────────────────
router.put('/:id', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID.' });
    }

    const {
      title, description, location, job_type,
      salary_min, salary_max, skills_required,
      experience_years, status, deadline
    } = req.body;

    // Verify ownership
    const [job] = await db.query(
      'SELECT recruiter_id FROM jobs WHERE id = ?', [jobId]
    );
    if (!job.length) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    if (job[0].recruiter_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this job.' });
    }

    await db.query(`
      UPDATE jobs
      SET title = ?, description = ?, location = ?, job_type = ?,
          salary_min = ?, salary_max = ?, skills_required = ?,
          experience_years = ?, status = ?, deadline = ?
      WHERE id = ?
    `, [
      title, description, location, job_type,
      salary_min || null, salary_max || null,
      skills_required, experience_years,
      status, deadline || null,
      jobId
    ]);

    res.json({ success: true, message: 'Job updated successfully.' });
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── DELETE /api/jobs/:id ─────────────────────────────────
router.delete('/:id', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID.' });
    }

    await db.query(
      'DELETE FROM jobs WHERE id = ? AND recruiter_id = ?',
      [jobId, req.user.id]
    );

    res.json({ success: true, message: 'Job deleted successfully.' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

module.exports = router;
