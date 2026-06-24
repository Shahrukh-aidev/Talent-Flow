// routes/ai.js — All AI Features (Powered by Groq - Free)
const express = require('express');
const router  = express.Router();
const db      = require('../config/mysql');
const { auth, requireRole } = require('../middleware/auth');
const { askGemini, parseGeminiJSON } = require('../config/aiClient');

// ═══════════════════════════════════════════════════════════
//  FEATURE 1 — AI Job Suggestions
//  POST /api/ai/job-suggestions
// ═══════════════════════════════════════════════════════════
router.post('/job-suggestions', auth, requireRole('seeker'), async (req, res) => {
  try {
    const seekerId = req.user.id;

    let seekerSkills    = [];
    let experienceYears = 0;
    let seekerName      = req.user.name || 'Candidate';

    try {
      const Resume = require('../models/Resume');
      const resume = await Resume.findOne({ userId: seekerId }).sort({ uploadedAt: -1 });
      if (resume && resume.parsedData) {
        seekerSkills    = resume.parsedData.skills               || [];
        experienceYears = resume.parsedData.totalYearsExperience || 0;
      }
    } catch (mongoErr) {
      console.warn('MongoDB fetch warning:', mongoErr.message);
    }

    if (seekerSkills.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload your resume first so we can detect your skills.' });
    }

    const [jobs] = await db.query(`
      SELECT j.id, j.title, j.location, j.job_type,
             j.salary_min, j.salary_max, j.skills_required,
             j.experience_years, c.name AS company_name
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE j.status = 'open'
      ORDER BY j.posted_at DESC
      LIMIT 20
    `);

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'No open jobs found.' });
    }

    const jobsList = jobs.map((j, i) =>
      `Job ${i + 1}: ID=${j.id}, Title="${j.title}", Company="${j.company_name || 'N/A'}", ` +
      `Location="${j.location || 'Remote'}", Type="${j.job_type}", ` +
      `Required Skills="${j.skills_required || 'Not specified'}", ` +
      `Min Experience=${j.experience_years || 0} years, ` +
      `Salary=${j.salary_min ? `PKR ${j.salary_min}-${j.salary_max}` : 'Not disclosed'}`
    ).join('\n');

    const prompt = `You are an expert career counselor AI for a recruitment platform in Pakistan.

CANDIDATE: Name="${seekerName}", Skills=[${seekerSkills.join(', ')}], Experience=${experienceYears} years

AVAILABLE JOBS:
${jobsList}

TASK: Return the TOP 5 best-matching jobs for this candidate. Calculate match % as (matching skills / required skills * 100).

Return ONLY this JSON array, no other text:
[
  {
    "jobId": <number>,
    "title": "<job title>",
    "company": "<company>",
    "location": "<location>",
    "jobType": "<type>",
    "matchPercent": <0-100>,
    "reason": "<1-2 sentence personal reason mentioning specific skills>",
    "skillsYouHave": ["skill1", "skill2"],
    "skillsMissing": ["skill3", "skill4"],
    "salaryMin": <number or null>,
    "salaryMax": <number or null>
  }
]`;

    console.log(`🤖 Sending job suggestion request to Groq for user ${seekerId}...`);
    const aiResponse = await askGemini(prompt);

    let suggestions;
    try {
      suggestions = parseGeminiJSON(aiResponse);
      if (!Array.isArray(suggestions)) suggestions = [suggestions];
    } catch (parseErr) {
      return res.status(500).json({ success: false, message: 'AI returned unexpected format. Try again.' });
    }

    res.json({ success: true, suggestions, seekerSkills, totalJobsAnalyzed: jobs.length });

  } catch (err) {
    console.error('AI job suggestions error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  FEATURE 2 — Match Score Explainer
//  POST /api/ai/match-explanation
// ═══════════════════════════════════════════════════════════
router.post('/match-explanation', auth, requireRole('seeker'), async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) return res.status(400).json({ success: false, message: 'applicationId is required.' });

    const [rows] = await db.query(`
      SELECT a.id, a.match_score, a.status,
             j.title AS job_title, j.skills_required, j.experience_years,
             c.name AS company_name
      FROM applications a
      JOIN jobs j           ON a.job_id    = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE a.id = ? AND a.seeker_id = ?
    `, [applicationId, req.user.id]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Application not found.' });

    const application = rows[0];

    let candidateSkills = [];
    try {
      const Resume = require('../models/Resume');
      const resume = await Resume.findOne({ userId: req.user.id }).sort({ uploadedAt: -1 });
      if (resume?.parsedData?.skills) candidateSkills = resume.parsedData.skills;
    } catch (mongoErr) { console.warn('MongoDB fetch warning:', mongoErr.message); }

    const requiredSkills = application.skills_required
      ? application.skills_required.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const skillsYouHave = requiredSkills.filter(req =>
      candidateSkills.some(c => c.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(c.toLowerCase()))
    );
    const skillsMissing = requiredSkills.filter(req => !skillsYouHave.includes(req));

    const prompt = `You are a career coach AI helping a job seeker in Pakistan understand their application score.

JOB: "${application.job_title}" at ${application.company_name || 'a company'}
REQUIRED SKILLS: ${requiredSkills.join(', ') || 'Not specified'}
CANDIDATE SKILLS: ${candidateSkills.join(', ') || 'None detected'}
CURRENT MATCH SCORE: ${Math.round(application.match_score)}%
SKILLS THEY HAVE: ${skillsYouHave.join(', ') || 'None from required list'}
SKILLS MISSING: ${skillsMissing.join(', ') || 'None'}

Return ONLY this JSON object, no other text:
{
  "scoreExplanation": "<2-3 sentences explaining the score with specific skills>",
  "strengths": "<1-2 sentences about what they are doing well>",
  "improvements": "<1-2 sentences about what would help most>",
  "learningRoadmap": [
    { "step": 1, "skill": "<skill>", "action": "<specific free course or project advice>", "timeEstimate": "<e.g. 2-4 weeks>" },
    { "step": 2, "skill": "<skill>", "action": "<advice>", "timeEstimate": "<time>" },
    { "step": 3, "skill": "<skill>", "action": "<advice>", "timeEstimate": "<time>" }
  ],
  "motivationalMessage": "<1 short encouraging sentence>",
  "potentialScore": <estimated score 0-100 after completing roadmap>
}`;

    console.log(`🤖 Generating match explanation for application ${applicationId}...`);
    const aiResponse = await askGemini(prompt);

    let explanation;
    try {
      explanation = parseGeminiJSON(aiResponse);
    } catch (parseErr) {
      return res.status(500).json({ success: false, message: 'AI returned unexpected format. Try again.' });
    }

    res.json({ success: true, explanation, skillsYouHave, skillsMissing, currentScore: Math.round(application.match_score), jobTitle: application.job_title, company: application.company_name });

  } catch (err) {
    console.error('Match explanation error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  FEATURE 3 — Resume Enhancer
//  POST /api/ai/improve-resume
//  Takes resume text → returns improved version + keywords
// ═══════════════════════════════════════════════════════════
router.post('/improve-resume', auth, requireRole('seeker'), async (req, res) => {
  try {
    const seekerId = req.user.id;

    // ── Get resume from MongoDB ──
    let resume = null;
    try {
      const Resume = require('../models/Resume');
      resume = await Resume.findOne({ userId: seekerId }).sort({ uploadedAt: -1 });
    } catch (mongoErr) {
      console.warn('MongoDB error:', mongoErr.message);
    }

    if (!resume) {
      return res.status(404).json({ success: false, message: 'No resume found. Please upload your resume first.' });
    }

    const currentSkills  = resume.parsedData?.skills            || [];
    const currentSummary = resume.parsedData?.summary           || '';
    const rawText        = resume.rawText?.substring(0, 3000)   || '';
    const name           = resume.parsedData?.name              || req.user.name;
    const experience     = resume.parsedData?.totalYearsExperience || 0;

    if (!rawText || rawText.length < 50) {
      return res.status(400).json({ success: false, message: 'Resume text is too short to improve. Try re-uploading your resume.' });
    }

    // ── Get target job if provided ──
    const { targetJobId } = req.body;
    let targetJobContext  = '';
    let jobSkillsRequired = [];

    if (targetJobId) {
      try {
        const [jobRows] = await db.query(
          'SELECT title, skills_required, description FROM jobs WHERE id = ?',
          [targetJobId]
        );
        if (jobRows.length > 0) {
          targetJobContext  = `TARGET JOB: "${jobRows[0].title}" requiring skills: ${jobRows[0].skills_required}`;
          jobSkillsRequired = (jobRows[0].skills_required || '').split(',').map(s => s.trim()).filter(Boolean);
        }
      } catch (dbErr) { console.warn('Job fetch warning:', dbErr.message); }
    }

    // Find missing skills if target job specified
    const missingSkills = jobSkillsRequired.filter(req =>
      !currentSkills.some(c => c.toLowerCase().includes(req.toLowerCase()))
    );

    const prompt = `You are a professional resume writer and career coach helping a job seeker in Pakistan improve their CV.

CANDIDATE INFORMATION:
- Name: ${name}
- Current Skills: ${currentSkills.join(', ') || 'Not detected'}
- Years of Experience: ${experience}
- Current Summary: "${currentSummary || 'No summary found'}"
${targetJobContext ? `\n${targetJobContext}` : ''}

RESUME TEXT (first 3000 chars):
${rawText}

TASK: Analyse this resume and provide comprehensive improvements.

Return ONLY this JSON object, no other text:
{
  "improvedSummary": "<A powerful 3-4 sentence professional summary that highlights their strongest skills, experience, and value. Make it specific, impactful, and ATS-friendly.>",
  "keywordsToAdd": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "missingKeywordsExplanation": "<1-2 sentences explaining why these keywords matter for job applications>",
  "bulletPointSuggestions": [
    {
      "section": "<e.g. Work Experience / Skills / Projects>",
      "original": "<original weak bullet or phrase if found, or 'New addition'>",
      "improved": "<stronger, more impactful version with action verbs and metrics>"
    },
    {
      "section": "<section>",
      "original": "<original or 'New addition'>",
      "improved": "<improved version>"
    },
    {
      "section": "<section>",
      "original": "<original or 'New addition'>",
      "improved": "<improved version>"
    }
  ],
  "overallScore": <current resume strength 0-100>,
  "improvedScore": <estimated score after improvements 0-100>,
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "criticalImprovements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "atsCompatibilityTips": "<2-3 sentences about making the resume more ATS friendly for Pakistani job market>"
}`;

    console.log(`🤖 Generating resume improvements for user ${seekerId}...`);
    const aiResponse = await askGemini(prompt);

    let improvements;
    try {
      improvements = parseGeminiJSON(aiResponse);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr.message);
      return res.status(500).json({ success: false, message: 'AI returned unexpected format. Try again.' });
    }

    res.json({
      success:        true,
      improvements,
      currentSkills,
      missingSkills,
      fileName:       resume.fileName,
      currentSummary,
    });

  } catch (err) {
    console.error('Resume improve error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
