// routes/resume.js  — Universal PDF Parser (text + image/scanned PDFs)
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const Resume  = require('../models/Resume');
const { auth, requireRole } = require('../middleware/auth');

// ── Multer — accept any PDF regardless of reported MIME type ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    // Accept if name ends in .pdf OR mime is pdf-related
    const isPdf =
      file.originalname.toLowerCase().endsWith('.pdf') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/octet-stream'; // Windows sometimes sends this for PDFs
    if (isPdf) cb(null, true);
    else cb(new Error(`Only PDF files are allowed. You uploaded: ${file.mimetype}`), false);
  }
});

// ── Strategy 1: Standard text extraction via pdf-parse ────
async function extractTextFromPDF(buffer) {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const text = (data.text || '').trim();
    console.log(`  [pdf-parse] extracted ${text.length} chars, ${data.numpages} pages`);
    return text;
  } catch (err) {
    console.warn('  [pdf-parse] failed:', err.message);
    return '';
  }
}

// ── Strategy 2: OCR via tesseract (for scanned/image PDFs) ─
async function extractTextViaOCR(buffer) {
  const fs   = require('fs');
  const path = require('path');
  const os   = require('os');
  const { execSync } = require('child_process');

  const tmpDir    = os.tmpdir();
  const pdfPath   = path.join(tmpDir, `resume_${Date.now()}.pdf`);
  const imgBase   = path.join(tmpDir, `resume_ocr_${Date.now()}`);
  const txtPath   = imgBase + '.txt';

  try {
    // Write PDF buffer to temp file
    fs.writeFileSync(pdfPath, buffer);

    // Try pdftoppm (part of poppler) to convert PDF→image, then tesseract
    let ocrText = '';

    // Method A: pdftotext (poppler)
    try {
      const pdftotext = execSync(`pdftotext "${pdfPath}" -`, { timeout: 15000 }).toString();
      if (pdftotext.trim().length > 50) {
        console.log(`  [pdftotext] extracted ${pdftotext.length} chars`);
        return pdftotext;
      }
    } catch { /* not available */ }

    // Method B: tesseract directly on PDF (tesseract 4+ supports PDF input)
    try {
      execSync(`tesseract "${pdfPath}" "${imgBase}" -l eng --oem 1 --psm 1 txt`, {
        timeout: 60000,
        stdio: 'pipe'
      });
      if (fs.existsSync(txtPath)) {
        ocrText = fs.readFileSync(txtPath, 'utf8').trim();
        console.log(`  [tesseract-pdf] extracted ${ocrText.length} chars`);
      }
    } catch (tErr) {
      console.warn('  [tesseract-pdf] failed:', tErr.message);
    }

    return ocrText;
  } catch (err) {
    console.warn('  [OCR] error:', err.message);
    return '';
  } finally {
    // Cleanup temp files
    [pdfPath, txtPath, imgBase + '.png', imgBase + '.jpg'].forEach(f => {
      try { if (require('fs').existsSync(f)) require('fs').unlinkSync(f); } catch {}
    });
  }
}

// ── Strategy 3: Manual byte-level text scraping ───────────
// Finds readable ASCII strings directly in PDF binary (last resort)
function extractTextFromPDFBytes(buffer) {
  try {
    const str = buffer.toString('latin1');
    // Extract text between BT (Begin Text) and ET (End Text) markers
    const btEtPattern = /BT([\s\S]*?)ET/g;
    const tjPattern   = /\(([^)]{2,200})\)\s*T[jJ]/g;
    const chunks      = [];

    let match;
    while ((match = btEtPattern.exec(str)) !== null) {
      const block = match[1];
      let inner;
      while ((inner = tjPattern.exec(block)) !== null) {
        const txt = inner[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        if (/[a-zA-Z@.]{3,}/.test(txt)) chunks.push(txt);
      }
    }

    // Also try TJ arrays: [(text) spacing (more text)] TJ
    const tjArrayPattern = /\[([^\]]{5,500})\]\s*TJ/g;
    while ((match = tjArrayPattern.exec(str)) !== null) {
      const inner = match[1].replace(/\([^)]*\)/g, m =>
        m.slice(1, -1).replace(/\\[nrt]/g, ' ')
      );
      if (/[a-zA-Z]{3,}/.test(inner)) chunks.push(inner);
    }

    const result = chunks.join(' ').replace(/\s{2,}/g, ' ').trim();
    console.log(`  [byte-scrape] extracted ${result.length} chars`);
    return result;
  } catch (err) {
    console.warn('  [byte-scrape] failed:', err.message);
    return '';
  }
}

// ── Master extraction — tries all strategies ──────────────
async function extractAllText(buffer) {
  console.log('🔍 Trying text extraction strategies...');

  // Strategy 1: pdf-parse (best for text PDFs)
  let text = await extractTextFromPDF(buffer);
  if (text.length > 100) {
    console.log('✅ Strategy 1 (pdf-parse) succeeded');
    return { text, method: 'pdf-parse' };
  }

  // Strategy 2: OCR (for scanned/image PDFs)
  console.log('⚠️  Strategy 1 insufficient, trying OCR...');
  text = await extractTextViaOCR(buffer);
  if (text.length > 100) {
    console.log('✅ Strategy 2 (OCR/tesseract) succeeded');
    return { text, method: 'ocr' };
  }

  // Strategy 3: Raw byte scraping
  console.log('⚠️  Strategy 2 insufficient, trying byte scraping...');
  text = extractTextFromPDFBytes(buffer);
  if (text.length > 50) {
    console.log('✅ Strategy 3 (byte-scrape) succeeded');
    return { text, method: 'byte-scrape' };
  }

  // All failed
  console.error('❌ All extraction strategies failed or returned <50 chars');
  return { text: '', method: 'none' };
}

// ─── POST /api/resume/upload ───────────────────────────────
router.post('/upload', auth, requireRole('seeker'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please select a PDF file.' });
    }

    console.log(`\n📄 Resume: "${req.file.originalname}" | ${(req.file.size/1024).toFixed(1)}KB | user=${req.user.id}`);

    // ── Extract text ──
    const { text: rawText, method } = await extractAllText(req.file.buffer);

    if (rawText.length < 10) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract text from this PDF. Please try: 1) Export your CV from Word/Google Docs as PDF, 2) Make sure it is not password-protected.',
        textLength: rawText.length
      });
    }

    // ── NLP Parse ──
    const { parseResumeText } = require('../utils/nlpParser');
    const parsedData = parseResumeText(rawText);

    console.log(`✅ Parsed: name="${parsedData.name}" | email="${parsedData.email}" | phone="${parsedData.phone}" | skills=${parsedData.skills.length} | method=${method}`);

    // ── Save to MongoDB ──
    await Resume.deleteMany({ userId: req.user.id });

    const resume = new Resume({
      userId:    req.user.id,
      fileName:  req.file.originalname,
      fileSize:  req.file.size,
      mimeType:  'application/pdf',
      rawText:   rawText.substring(0, 50000),
      parsedData,
      nlpMeta: {
        keywordsExtracted: parsedData.skills,
        processedAt:       new Date()
      }
    });

    await resume.save();
    console.log(`💾 Saved to MongoDB: ${resume._id}\n`);

    res.status(201).json({
      success:        true,
      message:        'Resume uploaded and parsed successfully!',
      resumeId:       resume._id,
      extractMethod:  method,
      textLength:     rawText.length,
      parsedData
    });

  } catch (err) {
    console.error('Resume upload error:', err);

    // Handle multer file filter error gracefully
    if (err.message && err.message.includes('Only PDF')) {
      return res.status(400).json({ success: false, message: err.message });
    }

    res.status(500).json({ success: false, message: 'Server error processing resume.', error: err.message });
  }
});

// ─── GET /api/resume/my ────────────────────────────────────
router.get('/my', auth, requireRole('seeker'), async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id }).sort({ uploadedAt: -1 });
    if (!resume) return res.status(404).json({ success: false, message: 'No resume found. Please upload your resume.' });
    res.json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── GET /api/resume/user/:userId (recruiter) ──────────────
router.get('/user/:userId', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: parseInt(req.params.userId) }).sort({ uploadedAt: -1 });
    if (!resume) return res.status(404).json({ success: false, message: 'No resume found for this user.' });
    res.json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── DELETE /api/resume/my ────────────────────────────────
router.delete('/my', auth, requireRole('seeker'), async (req, res) => {
  try {
    await Resume.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: 'Resume deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

module.exports = router;
