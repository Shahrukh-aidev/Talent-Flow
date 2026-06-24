// src/pages/ResumeUpload.js — With AI Resume Enhancer (Feature 3)
import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import Toast from '../components/Toast';

const METHOD_LABEL = {
  'pdf-parse':   { icon: '⚡', text: 'Direct text extraction', color: 'var(--green)'  },
  'ocr':         { icon: '🔍', text: 'OCR scan',               color: 'var(--yellow)' },
  'byte-scrape': { icon: '🛠️', text: 'Raw extraction',          color: 'var(--yellow)' },
};

// ── Score bar component ───────────────────────────────────
function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: 'var(--muted)' }}>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--border)' }}>
        <div style={{
          height: '100%', borderRadius: 999, background: color,
          width: `${value}%`, transition: 'width 1s ease'
        }} />
      </div>
    </div>
  );
}

// ── AI Enhancer Panel ─────────────────────────────────────
function AIEnhancerPanel({ onClose }) {
  const [loading,      setLoading]      = useState(true);
  const [data,         setData]         = useState(null);
  const [error,        setError]        = useState('');
  const [copiedSummary,setCopied]       = useState(false);
  const [activeTab,    setActiveTab]    = useState('summary'); // summary | keywords | bullets | tips

  useEffect(() => {
    API.post('/ai/improve-resume', {})
      .then(({ data }) => setData(data))
      .catch(err => setError(err.response?.data?.message || 'AI error. Try again.'))
      .finally(() => setLoading(false));
  }, []);

  const copySummary = () => {
    if (data?.improvements?.improvedSummary) {
      navigator.clipboard.writeText(data.improvements.improvedSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const tabs = [
    { id: 'summary',  label: '✍️ Summary'  },
    { id: 'keywords', label: '🔑 Keywords' },
    { id: 'bullets',  label: '📝 Bullets'  },
    { id: 'tips',     label: '💡 ATS Tips' },
  ];

  return (
    <div className="card" style={{
      marginTop: 24, border: '1px solid rgba(124,92,252,.4)',
      background: 'rgba(124,92,252,.03)'
    }}>
      {/* Panel header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>✨</span>
            <h3 style={{ fontFamily: 'Syne', fontSize: 18 }}>AI Resume Enhancer</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Powered by Groq AI — improvements tailored for the Pakistani job market
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          cursor: 'pointer', fontSize: 20, padding: '0 4px'
        }}>✕</button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>AI is reading your resume...</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Analysing skills, rewriting summary, finding keywords...
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {['Reading CV', 'Analysing skills', 'Writing improvements'].map((s, i) => (
              <div key={i} style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 11,
                background: 'rgba(124,92,252,.1)', color: 'var(--accent2)',
                border: '1px solid rgba(124,92,252,.2)',
                animation: `pulse 1.4s ease-in-out ${i * 0.3}s infinite`
              }}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--red)', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Score comparison */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
            marginBottom: 20, padding: '16px',
            background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)'
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, letterSpacing: .5 }}>CURRENT RESUME STRENGTH</div>
              <ScoreBar label="Before AI improvements" value={data.improvements.overallScore || 0} color="var(--yellow)" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--green)', marginBottom: 8, letterSpacing: .5 }}>AFTER APPLYING CHANGES</div>
              <ScoreBar label="Estimated after improvements" value={data.improvements.improvedScore || 0} color="var(--green)" />
            </div>
          </div>

          {/* Top strengths & critical improvements */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {data.improvements.topStrengths?.length > 0 && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.15)' }}>
                <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500, marginBottom: 8 }}>💪 TOP STRENGTHS</div>
                {data.improvements.topStrengths.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, paddingLeft: 12, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0 }}>•</span>{s}
                  </div>
                ))}
              </div>
            )}
            {data.improvements.criticalImprovements?.length > 0 && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.15)' }}>
                <div style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 500, marginBottom: 8 }}>⚡ QUICK WINS</div>
                {data.improvements.criticalImprovements.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, paddingLeft: 12, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0 }}>•</span>{s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                border: `1px solid ${activeTab === t.id ? 'var(--accent2)' : 'var(--border)'}`,
                background: activeTab === t.id ? 'rgba(124,92,252,.15)' : 'transparent',
                color: activeTab === t.id ? 'var(--accent2)' : 'var(--muted)',
                cursor: 'pointer', transition: 'all .2s'
              }}>{t.label}</button>
            ))}
          </div>

          {/* Tab: Improved Summary */}
          {activeTab === 'summary' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                AI rewrote your professional summary to be more impactful and ATS-friendly.
              </div>

              {/* Before */}
              {data.currentSummary && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: .5 }}>ORIGINAL SUMMARY</div>
                  <div style={{
                    padding: '12px 14px', borderRadius: 10, fontSize: 13,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    color: 'var(--muted)', lineHeight: 1.7, fontStyle: 'italic'
                  }}>
                    {data.currentSummary}
                  </div>
                </div>
              )}

              {/* After */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--green)', marginBottom: 6, letterSpacing: .5 }}>✨ AI IMPROVED SUMMARY</div>
                <div style={{
                  padding: '14px 16px', borderRadius: 10, fontSize: 13,
                  background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.2)',
                  color: 'var(--text)', lineHeight: 1.8, position: 'relative'
                }}>
                  {data.improvements.improvedSummary}
                  <button onClick={copySummary} style={{
                    position: 'absolute', top: 10, right: 10,
                    padding: '4px 10px', borderRadius: 6, fontSize: 11,
                    background: copiedSummary ? 'var(--green)' : 'var(--surface)',
                    border: '1px solid var(--border)', color: copiedSummary ? '#fff' : 'var(--muted)',
                    cursor: 'pointer', transition: 'all .2s'
                  }}>
                    {copiedSummary ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                  ↑ Copy this and replace the summary section in your Word/Google Docs resume.
                </p>
              </div>
            </div>
          )}

          {/* Tab: Keywords */}
          {activeTab === 'keywords' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.7 }}>
                Add these keywords to your resume so recruiters and ATS systems can find you:
              </div>
              {data.improvements.keywordsToAdd?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {data.improvements.keywordsToAdd.map(kw => (
                    <span key={kw} style={{
                      padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                      background: 'rgba(124,92,252,.12)', color: 'var(--accent2)',
                      border: '1px solid rgba(124,92,252,.3)'
                    }}>{kw}</span>
                  ))}
                </div>
              )}
              {data.improvements.missingKeywordsExplanation && (
                <div style={{
                  padding: '12px 14px', borderRadius: 10, fontSize: 13,
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--muted)', lineHeight: 1.7
                }}>
                  💡 {data.improvements.missingKeywordsExplanation}
                </div>
              )}
            </div>
          )}

          {/* Tab: Bullet Points */}
          {activeTab === 'bullets' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                Replace these weak phrases with stronger, results-focused bullet points:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.improvements.bulletPointSuggestions?.map((b, i) => (
                  <div key={i} style={{
                    borderRadius: 12, overflow: 'hidden',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{
                      padding: '6px 14px', fontSize: 11, fontWeight: 500,
                      background: 'var(--surface2)', color: 'var(--accent)',
                      letterSpacing: .5
                    }}>
                      {b.section?.toUpperCase()}
                    </div>
                    {b.original && b.original !== 'New addition' && (
                      <div style={{
                        padding: '10px 14px', fontSize: 13,
                        background: 'rgba(239,68,68,.04)', color: 'var(--muted)',
                        borderBottom: '1px solid var(--border)',
                        textDecoration: 'line-through', lineHeight: 1.6
                      }}>
                        ❌ {b.original}
                      </div>
                    )}
                    <div style={{
                      padding: '10px 14px', fontSize: 13,
                      background: 'rgba(34,197,94,.04)', color: 'var(--text)', lineHeight: 1.6
                    }}>
                      ✅ {b.improved}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: ATS Tips */}
          {activeTab === 'tips' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                ATS (Applicant Tracking System) tips for the Pakistani job market:
              </div>
              {data.improvements.atsCompatibilityTips && (
                <div style={{
                  padding: '16px 18px', borderRadius: 12, fontSize: 13,
                  background: 'rgba(79,142,247,.05)', border: '1px solid rgba(79,142,247,.2)',
                  color: 'var(--text)', lineHeight: 1.9
                }}>
                  {data.improvements.atsCompatibilityTips}
                </div>
              )}

              {/* General ATS tips */}
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { tip: 'Use standard section headings: "Work Experience", "Education", "Skills"' },
                  { tip: 'Avoid tables, columns, text boxes — ATS cannot parse them' },
                  { tip: 'Use .docx or .pdf format — never .jpeg or image-based PDFs' },
                  { tip: 'Include exact skill names from the job description' },
                  { tip: 'Add your city (e.g. Karachi, Lahore) — most Pakistani ATS filter by location' },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '10px 14px', borderRadius: 10, fontSize: 13,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    color: 'var(--muted)', display: 'flex', gap: 10, alignItems: 'flex-start'
                  }}>
                    <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>
                    {item.tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function ResumeUpload() {
  const [file,         setFile]         = useState(null);
  const [dragging,     setDragging]     = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [result,       setResult]       = useState(null);
  const [existing,     setExisting]     = useState(null);
  const [toast,        setToast]        = useState(null);
  const [showEnhancer, setShowEnhancer] = useState(false);

  useEffect(() => {
    API.get('/resume/my').then(({ data }) => setExisting(data.resume)).catch(() => {});
  }, []);

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))) {
      setFile(f);
    } else {
      setToast({ message: 'Please upload a PDF file.', type: 'error' });
    }
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true); setResult(null); setShowEnhancer(false);
    const fd = new FormData();
    fd.append('resume', file);
    try {
      const { data } = await API.post('/resume/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000
      });
      setResult(data.parsedData);
      setExisting(null);
      const skillCount = data.parsedData.skills?.length || 0;
      setToast({ message: `Resume parsed! Detected ${skillCount} skills.`, type: 'success' });
      setFile(null);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Upload failed.', type: 'error' });
    } finally { setUploading(false); }
  };

  const Field = ({ label, value }) => (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, letterSpacing: .5 }}>{label}</div>
      <div style={{ fontWeight: 500, fontSize: 14, color: value ? 'var(--text)' : 'var(--muted)', wordBreak: 'break-all' }}>
        {value || '—'}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="container" style={{ paddingTop: 40, maxWidth: 780 }}>

        <h1 style={{ fontFamily: 'Syne', fontSize: 30, marginBottom: 8 }}>Resume Manager</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
          Upload your PDF resume. NLP extracts your skills automatically.
          After uploading, use AI to improve your resume instantly.
        </p>

        {/* Existing resume */}
        {existing && !result && (
          <div className="card" style={{ marginBottom: 24, border: '1px solid var(--green)', background: 'rgba(34,197,94,.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(34,197,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{existing.fileName}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {new Date(existing.uploadedAt).toLocaleDateString()} · {existing.parsedData?.skills?.length || 0} skills
                </div>
              </div>
              <span className="badge badge-green">Active</span>
            </div>
            {existing.parsedData?.skills?.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>SKILLS ON FILE</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {existing.parsedData.skills.map(s => (
                    <span key={s} style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, background: 'rgba(79,142,247,.1)', color: 'var(--accent)', border: '1px solid rgba(79,142,247,.3)' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {/* AI Improve button for existing resume */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowEnhancer(prev => !prev)}
                style={{ fontSize: 14 }}>
                {showEnhancer ? '✕ Close AI Enhancer' : '✨ Improve with AI'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => document.getElementById('file-in').click()}>
                📤 Re-upload
              </button>
            </div>
          </div>
        )}

        {/* AI Enhancer for existing resume */}
        {existing && showEnhancer && (
          <AIEnhancerPanel onClose={() => setShowEnhancer(false)} />
        )}

        {/* Drop zone — only show when no existing resume or re-uploading */}
        {(!existing || !showEnhancer) && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById('file-in').click()}
              style={{
                border: `2px dashed ${dragging || file ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 16, padding: '44px 24px', textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'rgba(79,142,247,.05)' : 'var(--surface)',
                transition: 'all .2s', marginBottom: 16
              }}>
              <input id="file-in" type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
                onChange={e => e.target.files[0] && setFile(e.target.files[0])} />
              <div style={{ fontSize: 40, marginBottom: 12 }}>{file ? '📄' : '☁️'}</div>
              {file ? (
                <>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--accent)' }}>{file.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Drop your PDF resume here</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>or click to browse · Max 15MB · PDF only</div>
                </>
              )}
            </div>

            {file && !uploading && (
              <button className="btn btn-primary btn-full" onClick={upload} style={{ fontSize: 16, padding: 14, marginBottom: 24 }}>
                🧠 Upload & Parse Resume
              </button>
            )}

            {uploading && (
              <div style={{ textAlign: 'center', padding: 24, marginBottom: 24, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Parsing resume...</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Extracting text and running NLP analysis</div>
              </div>
            )}
          </>
        )}

        {/* NLP Results after upload */}
        {result && (
          <div className="card" style={{ border: '1px solid var(--accent2)', marginTop: 8 }}>
            <h3 style={{ fontFamily: 'Syne', marginBottom: 4 }}>🧠 NLP Parsing Results</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>Extracted from your resume:</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <Field label="NAME"       value={result.name} />
              <Field label="EMAIL"      value={result.email} />
              <Field label="PHONE"      value={result.phone} />
              <Field label="EXPERIENCE" value={result.totalYearsExperience > 0 ? `${result.totalYearsExperience} years` : 'Fresher'} />
            </div>

            {result.skills?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, letterSpacing: .5 }}>DETECTED SKILLS ({result.skills.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.skills.map(s => (
                    <span key={s} style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: 'rgba(124,92,252,.12)', border: '1px solid rgba(124,92,252,.3)', color: 'var(--accent2)' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Improve button — appears right after upload */}
            <div style={{
              padding: '16px', borderRadius: 12, marginTop: 4,
              background: 'linear-gradient(135deg, rgba(124,92,252,.08), rgba(79,142,247,.08))',
              border: '1px solid rgba(124,92,252,.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>✨ Want a stronger resume?</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Let AI rewrite your summary, find missing keywords, and improve bullet points.
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowEnhancer(prev => !prev)}
                  style={{ whiteSpace: 'nowrap' }}>
                  {showEnhancer ? '✕ Close' : '✨ Improve with AI'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', fontSize: 13, color: 'var(--green)' }}>
              ✅ Resume saved to database! Match scores will be calculated automatically.
            </div>
          </div>
        )}

        {/* AI Enhancer panel after upload */}
        {result && showEnhancer && (
          <AIEnhancerPanel onClose={() => setShowEnhancer(false)} />
        )}

      </div>
    </div>
  );
}
