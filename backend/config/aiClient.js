// config/aiClient.js — Groq API Client (Free, No Credit Card)
// Uses Llama 3.3 70B — fast, smart, 14,400 free requests/day
const https = require('https');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';

// Models to try in order
const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
];

/**
 * Make a single HTTPS POST to Groq
 */
function callGroq(model, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens:  1500,
    });

    const url     = new URL(GROQ_URL);
    const options = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          reject(new Error('Invalid JSON from Groq: ' + data.substring(0, 300)));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send prompt to Groq AI — tries multiple models
 */
async function askGemini(prompt) {   // kept as askGemini so no other file needs changing
  if (!GROQ_API_KEY || GROQ_API_KEY.trim() === '') {
    throw new Error('GROQ_API_KEY is missing in .env file. Add: GROQ_API_KEY=gsk_...');
  }

  let lastError = null;

  for (const model of MODELS) {
    try {
      console.log(`  🔄 Trying Groq model: ${model}`);
      const { status, json } = await callGroq(model, prompt);

      if (status === 200) {
        const text = json?.choices?.[0]?.message?.content;
        if (text) {
          console.log(`  ✅ Groq success with ${model}`);
          return text.trim();
        }
      }

      if (status === 429) {
        console.log(`  ⏳ Rate limited on ${model}, trying next model...`);
        await sleep(2000);
        lastError = new Error('Rate limited');
        continue;
      }

      if (status === 401) {
        throw new Error('Invalid GROQ_API_KEY. Check your key at console.groq.com');
      }

      lastError = new Error(json?.error?.message || `HTTP ${status}`);
      console.log(`  ⚠️  ${model} failed: ${lastError.message}`);

    } catch (err) {
      if (err.message.includes('Invalid GROQ_API_KEY')) throw err;
      lastError = err;
      console.log(`  ⚠️  ${model} error: ${err.message}`);
    }
  }

  throw new Error(lastError?.message || 'All Groq models failed. Check console.groq.com for status.');
}

/**
 * Parse JSON from AI response — handles markdown fences
 */
function parseGeminiJSON(text) {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const arrIdx = cleaned.indexOf('[');
  const objIdx = cleaned.indexOf('{');

  let startIdx;
  if (arrIdx === -1 && objIdx === -1) throw new Error('No JSON in AI response');
  else if (arrIdx === -1) startIdx = objIdx;
  else if (objIdx === -1) startIdx = arrIdx;
  else startIdx = Math.min(arrIdx, objIdx);

  const isArray = cleaned[startIdx] === '[';
  const endIdx  = cleaned.lastIndexOf(isArray ? ']' : '}');
  if (endIdx === -1) throw new Error('Malformed JSON in AI response');

  const jsonStr = cleaned.substring(startIdx, endIdx + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Fix trailing commas
    return JSON.parse(jsonStr.replace(/,\s*([}\]])/g, '$1'));
  }
}

module.exports = { askGemini, parseGeminiJSON };
