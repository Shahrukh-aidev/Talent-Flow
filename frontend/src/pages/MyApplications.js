// src/pages/MyApplications.js — With AI Match Score Explainer
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     class: 'badge-yellow', icon: '⏳' },
  reviewed:    { label: 'Reviewed',    class: 'badge-blue',   icon: '👁️' },
  shortlisted: { label: 'Shortlisted', class: 'badge-purple', icon: '⭐' },
  accepted:    { label: 'Accepted',    class: 'badge-green',  icon: '✅' },
  rejected:    { label: 'Rejected',    class: 'badge-red',    icon: '❌' },
};

// ── Score ring component ──────────────────────────────────
function ScoreRing({ score }) {
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div style={{
      width: 64, height: 64, borderRadius: '50%',
      background: `conic-gradient(${color} ${score * 3.6}deg, var(--surface2) 0deg)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: '50%',
        background: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'Syne' }}>{Math.round(score)}%</span>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>match</span>
      </div>
    </div>
  );
}

// ── AI Explanation Panel ──────────────────────────────────
function ExplanationPanel({ appId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    API.post('/ai/match-explanation', { applicationId: appId })
      .then(({ data }) => setData(data))
      .catch(err => setError(err.response?.data?.message || 'AI error. Try again.'))
      .finally(() => setLoading(false));
  }, [appId]);

  return (
    <div style={{
      marginTop: 12, borderRadius: 14,
      border: '1px solid rgba(79,142,247,.3)',
      background: 'rgba(79,142,247,.04)',
      overflow: 'hidden'
    }}>
      {/* Panel header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px',
        background: 'rgba(79,142,247,.08)',
        borderBottom: '1px solid rgba(79,142,247,.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>
          🤖 AI Score Analysis
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          cursor: 'pointer', fontSize: 16, padding: '0 4px'
        }}>✕</button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚙️</div>
            <div style={{ fontSize: 13 }}>AI is analysing your match score...</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--red)', fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Score explanation */}
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'var(--surface2)', border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500, marginBottom: 6, letterSpacing: .5 }}>
                WHY {data.currentScore}% MATCH
              </div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
                {data.explanation.scoreExplanation}
              </p>
            </div>

            {/* Skills breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)' }}>
                <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500, marginBottom: 8 }}>✅ SKILLS YOU HAVE</div>
                {data.skillsYouHave?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {data.skillsYouHave.map(s => (
                      <span key={s} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, background: 'rgba(34,197,94,.15)', color: 'var(--green)', border: '1px solid rgba(34,197,94,.3)' }}>{s}</span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>None matched</span>
                )}
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)' }}>
                <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 500, marginBottom: 8 }}>❌ SKILLS MISSING</div>
                {data.skillsMissing?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {data.skillsMissing.map(s => (
                      <span key={s} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, background: 'rgba(239,68,68,.15)', color: 'var(--red)', border: '1px solid rgba(239,68,68,.3)' }}>{s}</span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--green)' }}>🎉 Full match!</span>
                )}
              </div>
            </div>

            {/* Strengths */}
            {data.explanation.strengths && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.15)', fontSize: 13, color: 'var(--text)' }}>
                <span style={{ fontWeight: 500, color: 'var(--green)' }}>💪 Strengths: </span>
                {data.explanation.strengths}
              </div>
            )}

            {/* Learning Roadmap */}
            {data.explanation.learningRoadmap?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  📚 Learning Roadmap
                  {data.explanation.potentialScore && (
                    <span style={{ fontSize: 11, color: 'var(--green)', padding: '2px 8px', borderRadius: 999, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)' }}>
                      Reach {data.explanation.potentialScore}% after completing
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.explanation.learningRoadmap.map((step) => (
                    <div key={step.step} style={{
                      display: 'flex', gap: 12, padding: '10px 12px',
                      borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)'
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(79,142,247,.15)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700
                      }}>{step.step}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>
                          {step.skill}
                          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>
                            ⏱ {step.timeEstimate}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{step.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Motivational message */}
            {data.explanation.motivationalMessage && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(79,142,247,.08), rgba(124,92,252,.08))',
                border: '1px solid rgba(79,142,247,.2)',
                fontSize: 13, color: 'var(--text)', fontStyle: 'italic'
              }}>
                ✨ {data.explanation.motivationalMessage}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [openExplainer, setOpenExplainer] = useState(null); // application id

  useEffect(() => {
    API.get('/applications/my')
      .then(({ data }) => setApplications(data.applications))
      .finally(() => setLoading(false));
  }, []);

  const toggleExplainer = (appId) => {
    setOpenExplainer(prev => prev === appId ? null : appId);
  };

  if (loading) return (
    <div className="container" style={{ paddingTop: 60 }}>
      {[1,2,3].map(i => (
        <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 16 }} />
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      <div className="container" style={{ paddingTop: 40 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 30, marginBottom: 6 }}>My Applications</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Track your applications · Click <strong style={{ color: 'var(--accent)' }}>"Why this score?"</strong> on any card for AI analysis
          </p>
        </div>

        {/* Empty state */}
        {applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h3 style={{ marginBottom: 8 }}>No applications yet</h3>
            <p style={{ marginBottom: 20 }}>Start applying to jobs to see them here</p>
            <Link to="/"><button className="btn btn-primary">Browse Jobs →</button></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {applications.map(app => {
              const cfg        = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
              const isOpen     = openExplainer === app.id;

              return (
                <div key={app.id} className="card" style={{
                  border: isOpen ? '1px solid rgba(79,142,247,.4)' : '1px solid var(--border)',
                  transition: 'border-color .2s'
                }}>
                  {/* Application row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>

                    {/* Score ring */}
                    <ScoreRing score={Math.round(app.match_score)} />

                    {/* Job info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 16, fontFamily: 'Syne' }}>{app.job_title}</h3>
                        <span className={`badge ${cfg.class}`}>{cfg.icon} {cfg.label}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span>🏢 {app.company_name || 'Company'}</span>
                        <span>📍 {app.location}</span>
                        <span>💼 {app.job_type}</span>
                        {app.salary_min && (
                          <span style={{ color: 'var(--green)' }}>
                            PKR {Number(app.salary_min).toLocaleString()}+
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                        Applied {new Date(app.applied_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                      {/* AI Explain button */}
                      <button
                        className="btn btn-sm"
                        onClick={() => toggleExplainer(app.id)}
                        style={{
                          background: isOpen ? 'rgba(79,142,247,.15)' : 'transparent',
                          border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
                          color: isOpen ? 'var(--accent)' : 'var(--muted)',
                          fontSize: 12, whiteSpace: 'nowrap', transition: 'all .2s'
                        }}>
                        🤖 {isOpen ? 'Hide Analysis' : 'Why this score?'}
                      </button>
                      <Link to={`/jobs/${app.job_id}`}>
                        <button className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                          View Job
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* AI Explainer Panel — expands inline */}
                  {isOpen && (
                    <ExplanationPanel
                      appId={app.id}
                      onClose={() => setOpenExplainer(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
