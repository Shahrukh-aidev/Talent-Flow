// src/pages/AISuggestions.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AISuggestions() {
  const { user }  = useAuth();
  const [loading,     setLoading]     = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [seekerSkills,setSkills]      = useState([]);
  const [analyzed,    setAnalyzed]    = useState(0);
  const [error,       setError]       = useState('');
  const [hasResume,   setHasResume]   = useState(null); // null = checking
  const [applying,    setApplying]    = useState(null);
  const [applied,     setApplied]     = useState({});
  const [toast,       setToast]       = useState(null);

  // Check if resume exists
  useEffect(() => {
    API.get('/resume/my')
      .then(() => setHasResume(true))
      .catch(() => setHasResume(false));
  }, []);

  // Show toast for 3 seconds
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const getSuggestions = async () => {
    setLoading(true);
    setError('');
    setSuggestions([]);
    try {
      const { data } = await API.post('/ai/job-suggestions');
      setSuggestions(data.suggestions || []);
      setSkills(data.seekerSkills     || []);
      setAnalyzed(data.totalJobsAnalyzed || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyNow = async (jobId) => {
    setApplying(jobId);
    try {
      await API.post('/applications', { job_id: jobId, cover_letter: '' });
      setApplied(prev => ({ ...prev, [jobId]: true }));
      setToast({ msg: 'Application submitted!', type: 'success' });
    } catch (err) {
      setToast({ msg: err.response?.data?.message || 'Apply failed.', type: 'error' });
    } finally {
      setApplying(null);
    }
  };

  // Score color
  const scoreColor = (pct) => {
    if (pct >= 75) return 'var(--green)';
    if (pct >= 50) return 'var(--yellow)';
    return 'var(--red)';
  };

  const scoreLabel = (pct) => {
    if (pct >= 75) return 'Great fit';
    if (pct >= 50) return 'Good fit';
    if (pct >= 30) return 'Partial fit';
    return 'Low match';
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          padding: '14px 22px', borderRadius: 12, fontSize: 14, fontWeight: 500,
          background: toast.type === 'success' ? 'var(--green)' : 'var(--red)',
          color: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,.4)',
          animation: 'slideIn .3s ease'
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <div className="container" style={{ paddingTop: 40, maxWidth: 800 }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
            }}>🤖</div>
            <h1 style={{ fontFamily: 'Syne', fontSize: 28 }}>AI Job Suggestions</h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            Our AI analyses your resume skills against all available jobs and recommends
            the best matches — with a personal explanation for each one.
          </p>
        </div>

        {/* No resume state */}
        {hasResume === false && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <h3 style={{ fontFamily: 'Syne', marginBottom: 8 }}>No resume found</h3>
            <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 14 }}>
              Upload your resume first so AI can analyse your skills and suggest the right jobs.
            </p>
            <Link to="/upload-resume">
              <button className="btn btn-primary">Upload Resume →</button>
            </Link>
          </div>
        )}

        {/* Main CTA */}
        {hasResume === true && suggestions.length === 0 && !loading && !error && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✨</div>
            <h3 style={{ fontFamily: 'Syne', fontSize: 22, marginBottom: 10 }}>
              Find your best job matches
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28, maxWidth: 440, margin: '0 auto 28px' }}>
              Click below and our AI will read your resume, compare your skills to every open
              job in the database, and rank the top 5 best fits — with reasons.
            </p>
            <button
              className="btn btn-primary"
              onClick={getSuggestions}
              style={{ fontSize: 16, padding: '14px 32px' }}>
              🤖 Get AI Job Suggestions
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 44, marginBottom: 16, animation: 'spin 2s linear infinite' }}>⚙️</div>
            <h3 style={{ fontFamily: 'Syne', marginBottom: 10 }}>AI is analysing your profile...</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              Reading your skills from MongoDB, comparing against all jobs in MySQL,<br/>
              and asking Gemini AI to rank the best matches for you.
            </p>
            <div style={{
              marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8
            }}>
              {['Reading resume', 'Fetching jobs', 'AI ranking...'].map((step, i) => (
                <div key={i} style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12,
                  background: 'rgba(79,142,247,.1)', color: 'var(--accent)',
                  border: '1px solid rgba(79,142,247,.3)',
                  animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`
                }}>{step}</div>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="card" style={{
            border: '1px solid var(--red)', background: 'rgba(239,68,68,.04)',
            textAlign: 'center', padding: '32px 24px'
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ marginBottom: 8, color: 'var(--red)' }}>AI Error</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>{error}</p>
            <button className="btn btn-primary" onClick={getSuggestions}>Try Again</button>
          </div>
        )}

        {/* Results */}
        {suggestions.length > 0 && !loading && (
          <>
            {/* Summary bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 20, padding: '12px 16px',
              background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {suggestions.length} best matches
                </span>
                {' '}found from {analyzed} open jobs · Your skills:{' '}
                <span style={{ color: 'var(--text)' }}>{seekerSkills.slice(0, 4).join(', ')}
                  {seekerSkills.length > 4 && ` +${seekerSkills.length - 4} more`}
                </span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={getSuggestions}
                style={{ fontSize: 12 }}>
                🔄 Refresh
              </button>
            </div>

            {/* Job suggestion cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {suggestions.map((s, i) => (
                <div key={s.jobId || i} className="card" style={{
                  border: `1px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'}`,
                  position: 'relative', overflow: 'hidden'
                }}>
                  {/* Rank badge */}
                  {i === 0 && (
                    <div style={{
                      position: 'absolute', top: 0, right: 0,
                      background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
                      color: '#fff', fontSize: 11, fontWeight: 600,
                      padding: '4px 14px', borderBottomLeftRadius: 10
                    }}>
                      ⭐ Best Match
                    </div>
                  )}

                  {/* Card header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ paddingRight: i === 0 ? 80 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: 'var(--surface2)', border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: 'var(--muted)'
                        }}>#{i + 1}</span>
                        <h3 style={{ fontFamily: 'Syne', fontSize: 17 }}>{s.title}</h3>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {s.company  && <span>🏢 {s.company}</span>}
                        {s.location && <span>📍 {s.location}</span>}
                        {s.jobType  && <span>💼 {s.jobType}</span>}
                        {s.salaryMin && (
                          <span style={{ color: 'var(--green)' }}>
                            PKR {Number(s.salaryMin).toLocaleString()}
                            {s.salaryMax && ` – ${Number(s.salaryMax).toLocaleString()}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Match score circle */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        border: `3px solid ${scoreColor(s.matchPercent)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', marginBottom: 4
                      }}>
                        <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne', color: scoreColor(s.matchPercent) }}>
                          {s.matchPercent}%
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: scoreColor(s.matchPercent), fontWeight: 500 }}>
                        {scoreLabel(s.matchPercent)}
                      </div>
                    </div>
                  </div>

                  {/* AI reason */}
                  <div style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(79,142,247,.06)',
                    border: '1px solid rgba(79,142,247,.15)',
                    marginBottom: 14
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500, marginBottom: 5, letterSpacing: .5 }}>
                      🤖 AI ANALYSIS
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
                      {s.reason}
                    </p>
                  </div>

                  {/* Skills breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    {/* Skills you have */}
                    {s.skillsYouHave?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--green)', marginBottom: 6, fontWeight: 500 }}>
                          ✅ SKILLS YOU HAVE
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {s.skillsYouHave.map(sk => (
                            <span key={sk} style={{
                              padding: '3px 9px', borderRadius: 999, fontSize: 11,
                              background: 'rgba(34,197,94,.1)', color: 'var(--green)',
                              border: '1px solid rgba(34,197,94,.25)'
                            }}>{sk}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Skills missing */}
                    {s.skillsMissing?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 6, fontWeight: 500 }}>
                          ❌ SKILLS MISSING
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {s.skillsMissing.map(sk => (
                            <span key={sk} style={{
                              padding: '3px 9px', borderRadius: 999, fontSize: 11,
                              background: 'rgba(239,68,68,.1)', color: 'var(--red)',
                              border: '1px solid rgba(239,68,68,.25)'
                            }}>{sk}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    {applied[s.jobId] ? (
                      <div style={{
                        flex: 1, padding: '10px', borderRadius: 10, textAlign: 'center',
                        background: 'rgba(34,197,94,.1)', color: 'var(--green)',
                        border: '1px solid rgba(34,197,94,.3)', fontSize: 14, fontWeight: 500
                      }}>
                        ✅ Applied Successfully!
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        disabled={applying === s.jobId}
                        onClick={() => applyNow(s.jobId)}>
                        {applying === s.jobId ? 'Applying...' : '🚀 Apply Now'}
                      </button>
                    )}
                    <Link to={`/jobs/${s.jobId}`}>
                      <button className="btn btn-outline">View Details</button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Get more button */}
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button className="btn btn-outline" onClick={getSuggestions} style={{ gap: 8 }}>
                🔄 Regenerate Suggestions
              </button>
            </div>
          </>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes slideIn { from{transform:translateX(100px);opacity:0} to{transform:translateX(0);opacity:1} }
      `}</style>
    </div>
  );
}
