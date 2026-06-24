// server.js — Updated with AI route
const express      = require('express');
const cors         = require('cors');
require('dotenv').config();

const connectMongo = require('./config/mongodb');
const app          = express();

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'] }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

connectMongo();

// Load and validate all routes
const routes = [
  ['auth',         require('./routes/auth')],
  ['jobs',         require('./routes/jobs')],
  ['applications', require('./routes/applications')],
  ['resume',       require('./routes/resume')],
  ['companies',    require('./routes/companies')],
  ['ai',           require('./routes/ai')],           // ← NEW
];

routes.forEach(([name, route]) => {
  if (typeof route !== 'function') {
    console.error(`❌ Route '${name}' is invalid. Check routes/${name}.js`);
    process.exit(1);
  }
});

app.use('/api/auth',         routes[0][1]);
app.use('/api/jobs',         routes[1][1]);
app.use('/api/applications', routes[2][1]);
app.use('/api/resume',       routes[3][1]);
app.use('/api/companies',    routes[4][1]);
app.use('/api/ai',           routes[5][1]);           // ← NEW

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart Recruitment API running', time: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n===========================================');
  console.log('  Smart Recruitment System — Backend');
  console.log(`  Server running on port ${PORT}`);
  console.log('===========================================');
  console.log(`  Health:  http://localhost:${PORT}/api/health`);
  console.log(`  AI API:  http://localhost:${PORT}/api/ai/job-suggestions`);
  console.log('');
});

module.exports = app;
