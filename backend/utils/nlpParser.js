// utils/nlpParser.js — Universal Resume Parser v3 (Final)
// Works with: Pakistani CVs, international CVs, OCR text, noisy text

// ── Skills Master List ────────────────────────────────────
const SKILLS = [
  // Languages
  'JavaScript','TypeScript','Python','Java','C++','C#','C','PHP','Ruby',
  'Go','Rust','Swift','Kotlin','Dart','Scala','R','MATLAB','Perl','Bash','Shell',
  // Frontend
  'React','Angular','Vue','Next.js','Nuxt.js','Svelte','jQuery',
  'Bootstrap','Tailwind','HTML','HTML5','CSS','CSS3','SASS','SCSS',
  'Material UI','Chakra UI','Ant Design','Redux','MobX','Webpack','Vite',
  // Backend
  'Node.js','Express','Django','Flask','FastAPI','Spring Boot','Spring',
  'Laravel','CodeIgniter','ASP.NET','.NET','Rails','NestJS','Hapi','Koa',
  'Symfony','Strapi',
  // Databases
  'MySQL','PostgreSQL','MongoDB','Redis','SQLite','Oracle','Firebase',
  'Cassandra','DynamoDB','MariaDB','SQL Server','Supabase','Elasticsearch',
  'Neo4j','MS SQL','MSSQL',
  // Cloud & DevOps
  'AWS','Azure','GCP','Google Cloud','Docker','Kubernetes','CI/CD',
  'Jenkins','GitHub Actions','GitLab CI','Linux','Nginx','Apache',
  'Terraform','Ansible','Heroku','Vercel','Netlify',
  // Mobile
  'React Native','Flutter','Android','iOS','Ionic','Xamarin',
  // Data & AI
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Keras',
  'Scikit-learn','Pandas','NumPy','Matplotlib','Seaborn','OpenCV',
  'NLP','Data Analysis','Data Science','Power BI','Tableau',
  'Artificial Intelligence','Computer Vision','OpenAI','LangChain',
  // Tools & Practices
  'Git','GitHub','GitLab','Bitbucket','Jira','Figma','Postman',
  'REST API','GraphQL','Microservices','Agile','Scrum','OOP',
  'Unit Testing','Jest','Mocha','Selenium','Cypress','Socket.io',
  'WebSocket','OAuth','JWT','SOAP','XML','JSON','YAML',
  // Office & General
  'Microsoft Office','Word','Excel','PowerPoint','Google Sheets',
];

const LANGUAGES = [
  'English','Urdu','Arabic','French','German','Spanish','Chinese',
  'Hindi','Punjabi','Sindhi','Pashto','Persian','Turkish',
];

// ── Main Entry Point ──────────────────────────────────────
function parseResumeText(rawText) {
  if (!rawText || rawText.trim().length === 0) {
    return emptyResult();
  }

  // Clean and normalize the text
  const text = cleanText(rawText);

  return {
    name:                 extractName(text),
    email:                extractEmail(text),
    phone:                extractPhone(text),
    skills:               extractSkills(text),
    education:            extractEducation(text),
    experience:           extractExperience(text),
    summary:              extractSummary(text),
    languages:            extractLanguages(text),
    totalYearsExperience: estimateYears(text),
  };
}

function emptyResult() {
  return { name:'', email:'', phone:'', skills:[], education:[], experience:[], summary:'', languages:[], totalYearsExperience:0 };
}

// ── Text Cleaning ─────────────────────────────────────────
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\f/g, '\n')           // form feeds
    .replace(/\u00a0/g, ' ')        // non-breaking spaces
    .replace(/[^\x20-\x7E\n\t]/g, match => {  // keep printable ASCII + common unicode
      const code = match.charCodeAt(0);
      return (code > 127 && code < 65536) ? match : ' ';
    })
    .replace(/[ \t]{3,}/g, '  ')    // collapse horizontal whitespace
    .replace(/\n{4,}/g, '\n\n')     // collapse excessive blank lines
    .trim();
}

// ── Email ─────────────────────────────────────────────────
function extractEmail(text) {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase().trim() : '';
}

// ── Phone ─────────────────────────────────────────────────
function extractPhone(text) {
  const patterns = [
    /(\+92[\s.\-]?\d{3}[\s.\-]?\d{7})/,         // +92 300 1234567
    /(\+92[\s.\-]?\(\d{3}\)[\s.\-]?\d{7})/,      // +92 (300) 1234567
    /(0\d{2,3}[\s.\-]\d{7,8})/,                   // 0300 1234567 or 021 12345678
    /(0\d{10})/,                                   // 03001234567 (no spaces)
    /(\(\d{3,4}\)[\s.\-]?\d{6,8})/,               // (021) 1234567
    /(\+\d{1,3}[\s.\-]\d{3}[\s.\-]\d{4,7})/,      // +1 123 4567890
    /(\+\d{10,13})/,                               // +923001234567
    /(\d{4}[\s.\-]\d{7})/,                        // 0300-1234567
    /(\d{3}[\s.\-]\d{3}[\s.\-]\d{4})/,            // 123-456-7890
    /(?:phone|mobile|cell|tel|contact)[:\s]+([+\d][\d\s.\-()]{8,16})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const phone = (m[1] || m[0]).trim().replace(/\s+/g, ' ');
      if (phone.replace(/\D/g, '').length >= 9) return phone;
    }
  }
  return '';
}

// ── Name ──────────────────────────────────────────────────
function extractName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Strategy 1: Explicit label like "Name: Ali Hassan"
  for (const line of lines.slice(0, 25)) {
    const m = line.match(/^(?:name|full\s*name|candidate|applicant)\s*[:–\-]\s*(.+)/i);
    if (m) {
      const n = m[1].trim().replace(/[^a-zA-Z\s.]/g, '').trim();
      if (isGoodName(n)) return toTitleCase(n);
    }
  }

  // Strategy 2: All-caps line near the top (very common in Pakistani CVs)
  for (const line of lines.slice(0, 12)) {
    if (
      /^[A-Z][A-Z\s.]{3,49}$/.test(line) &&
      !isHeaderWord(line) &&
      line.split(' ').length >= 2
    ) {
      return toTitleCase(line);
    }
  }

  // Strategy 3: First line that looks like a name (2-5 words, letters only)
  for (const line of lines.slice(0, 10)) {
    const clean = line.replace(/[^a-zA-Z\s.]/g, '').trim();
    if (isGoodName(clean) && !isHeaderWord(clean)) {
      return toTitleCase(clean);
    }
  }

  // Strategy 4: Line BEFORE email line
  const emailIdx = lines.findIndex(l => /@/.test(l));
  if (emailIdx > 0) {
    const candidate = lines[emailIdx - 1].replace(/[^a-zA-Z\s]/g, '').trim();
    if (isGoodName(candidate)) return toTitleCase(candidate);
  }

  return '';
}

function isGoodName(str) {
  const words = str.trim().split(/\s+/).filter(Boolean);
  return (
    words.length >= 2 && words.length <= 6 &&
    str.length >= 4 && str.length <= 55 &&
    /^[a-zA-Z\s.]+$/.test(str) &&
    !isHeaderWord(str)
  );
}

function isHeaderWord(str) {
  const headers = [
    'curriculum vitae','resume','cv','profile','contact information',
    'objective','summary','education','experience','skills','projects',
    'references','personal information','personal details',
    'career objective','professional summary','work experience',
    'academic background','certifications','achievements','address',
  ];
  const lower = str.toLowerCase().trim();
  return headers.some(h => lower === h || lower.startsWith(h));
}

function toTitleCase(str) {
  return str.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ── Skills ────────────────────────────────────────────────
function extractSkills(text) {
  const found = [];
  // Use the full text plus lowercase version
  const searchText = ' ' + text + ' ';

  for (const skill of SKILLS) {
    // Escape regex special chars in skill name
    const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Allow word boundaries, hyphens, slashes as separators
    const re = new RegExp(`(?:^|[\\s,;/\\(\\[\\-])${esc}(?:[\\s,;/\\)\\]\\.\\-]|$)`, 'i');
    if (re.test(searchText)) {
      if (!found.find(f => f.toLowerCase() === skill.toLowerCase())) {
        found.push(skill);
      }
    }
  }

  return found;
}

// ── Languages ─────────────────────────────────────────────
function extractLanguages(text) {
  const lower = ' ' + text.toLowerCase() + ' ';
  return LANGUAGES.filter(lang =>
    new RegExp(`(?:^|[\\s,;])${lang.toLowerCase()}(?:[\\s,;:.]|$)`, 'i').test(lower)
  );
}

// ── Education ─────────────────────────────────────────────
function extractEducation(text) {
  const lines   = text.split('\n');
  const results = [];

  const degreeRe = /\b(bachelor|master|phd|ph\.d|doctorate|b\.?s\.?c?|m\.?s\.?c?|b\.?e\.?|m\.?e\.?|b\.?tech|m\.?tech|bcs|mcs|mba|bba|b\.?com|m\.?com|intermediate|matriculat|matric|f\.?s\.?c|f\.?a\.?|hsc|ssc|o[\s-]level|a[\s-]level|high\s*school|secondary)\b/i;

  lines.forEach((line, i) => {
    if (!degreeRe.test(line)) return;

    const context  = [line, lines[i+1]||'', lines[i+2]||''].join(' ');
    const yearM    = context.match(/\b(19|20)\d{2}\b/);
    const gradeM   = context.match(/(?:cgpa|gpa|grade|marks|percentage|score)\s*[:\-]?\s*([\d.]+\s*(?:\/\s*[\d.]+)?%?)/i);

    results.push({
      degree:      line.trim().substring(0, 120),
      institution: (lines[i+1] || '').trim().substring(0, 100),
      year:        yearM  ? parseInt(yearM[0])   : null,
      grade:       gradeM ? gradeM[1].trim()      : '',
    });
  });

  // Dedupe on first 25 chars of degree
  const seen = new Set();
  return results.filter(e => {
    const key = e.degree.toLowerCase().substring(0, 25);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 6);
}

// ── Work Experience ───────────────────────────────────────
function extractExperience(text) {
  const lines   = text.split('\n');
  const results = [];

  // Find experience section
  const secStart = /\b(work\s*experience|professional\s*experience|employment|career\s*history|experience)\b/i;
  const secEnd   = /\b(education|academic|skills|projects|certifications|awards|references|languages|hobbies|interests|activities)\b/i;

  let inSec = false;
  const expLines = [];

  for (const line of lines) {
    if (!inSec && secStart.test(line)) { inSec = true; continue; }
    if (inSec && secEnd.test(line) && line.trim().length < 50) break;
    if (inSec) expLines.push(line);
  }

  // If no section found, search whole document
  const searchLines = expLines.length > 3 ? expLines : lines;

  const yearRangeRe = /\b(\d{4})\s*[-–—to]+\s*(\d{4}|present|current|now|till\s*date|ongoing)/i;
  const monYearRe   = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{4})\s*[-–—to]+\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current)[a-z]*\.?\s*(\d{0,4})/i;

  searchLines.forEach((line, i) => {
    const yr = line.match(yearRangeRe);
    const mo = line.match(monYearRe);

    if (yr || mo) {
      const start = yr ? parseInt(yr[1]) : null;
      const endRaw = yr ? yr[2] : (mo ? mo[3] : '');
      const isPresent = /present|current|now|ongoing/i.test(endRaw);
      const end = isPresent ? new Date().getFullYear() : (yr ? parseInt(yr[2]) || null : null);

      // Grab title from line above or same line
      const title   = (searchLines[i - 1] || '').trim().substring(0, 100);
      const company = (searchLines[i + 1] || '').trim().substring(0, 100);

      if (!start || start < 1990 || start > new Date().getFullYear() + 1) return;

      results.push({
        title,
        company,
        duration:  line.trim(),
        startYear: start,
        endYear:   end,
      });
    }
  });

  return results.slice(0, 8);
}

// ── Summary / Objective ───────────────────────────────────
function extractSummary(text) {
  const lines = text.split('\n');
  const triggers = ['summary','objective','profile','about me','about','career objective','professional summary','overview','personal statement'];

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase().trim();
    if (triggers.some(t => lower.includes(t)) && lines[i].length < 60) {
      const parts = [];
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const l = lines[j].trim();
        if (l.length > 15) parts.push(l);
        else if (parts.length >= 2 && l.length === 0) break;
      }
      const s = parts.join(' ').substring(0, 700);
      if (s.length > 30) return s;
    }
  }
  return '';
}

// ── Years of Experience ───────────────────────────────────
function estimateYears(text) {
  // Direct mention: "5+ years experience"
  const direct = text.match(/(\d+)\+?\s*years?\s*(?:of\s*)?(?:work\s*)?(?:experience|exp|industry)/i);
  if (direct) return parseInt(direct[1]);

  // From year ranges
  const ranges = [...text.matchAll(/\b(\d{4})\s*[-–—to]+\s*(\d{4}|present|current)/gi)];
  let total = 0;
  const thisYear = new Date().getFullYear();

  for (const m of ranges) {
    const s = parseInt(m[1]);
    const eRaw = m[2];
    const e = /present|current/i.test(eRaw) ? thisYear : parseInt(eRaw);
    if (s >= 1990 && s <= thisYear && e >= s && (e - s) <= 40) {
      total += (e - s);
    }
  }
  return Math.min(total, 50);
}

// ── Match Score ───────────────────────────────────────────
function calculateMatchScore(resumeSkills, jobSkillsString) {
  if (!jobSkillsString || !resumeSkills?.length) return 0;

  const required = jobSkillsString
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!required.length) return 0;

  const have = resumeSkills.map(s => s.toLowerCase());
  const matched = required.filter(req =>
    have.some(h => h.includes(req) || req.includes(h))
  );

  return Math.round((matched.length / required.length) * 100);
}

module.exports = { parseResumeText, calculateMatchScore };
