// routes/auth.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/mysql');
const { auth } = require('../middleware/auth');
require('dotenv').config();

// ─── POST /api/auth/register ───────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check duplicate email
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'This email is already registered. Please login.' });
    }

    const hashed = await bcrypt.hash(password, 12);

    // Column is "name" in schema — NOT "full_name"
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashed, role || 'seeker', phone || null, location || null]
    );

    const token = jwt.sign(
      { id: result.insertId, role: role || 'seeker', name: name.trim() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ New user registered: ${name} (${email}) as ${role || 'seeker'}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: { id: result.insertId, name: name.trim(), email: email.toLowerCase().trim(), role: role || 'seeker' }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.', error: err.message });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...safeUser } = user;
    console.log(`✅ User logged in: ${user.name} (${user.email})`);

    res.json({ success: true, message: 'Login successful!', token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.', error: err.message });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, phone, location, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── PUT /api/auth/profile ─────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    await db.query(
      'UPDATE users SET name = ?, phone = ?, location = ? WHERE id = ?',
      [name, phone || null, location || null, req.user.id]
    );
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

module.exports = router;
