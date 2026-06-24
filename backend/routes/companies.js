// routes/companies.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/mysql');
const { auth, requireRole } = require('../middleware/auth');

// GET all companies
router.get('/', async (req, res) => {
  try {
    const [companies] = await db.query(`
      SELECT c.*, u.name AS recruiter_name
      FROM companies c
      JOIN users u ON c.recruiter_id = u.id
    `);
    res.json({ success: true, companies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create company
router.post('/', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const { name, industry, website, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Company name required.' });

    const [result] = await db.query(
      'INSERT INTO companies (recruiter_id, name, industry, website, description) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, industry || '', website || '', description || '']
    );
    res.status(201).json({ success: true, message: 'Company created!', companyId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET my companies
router.get('/my', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const [companies] = await db.query(
      'SELECT * FROM companies WHERE recruiter_id = ?', [req.user.id]
    );
    res.json({ success: true, companies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
