// src/pages/Dashboard.js — Updated with AI Suggestions button
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const { user }  = useAuth();
  const [stats,   setStats]   = useState(null);
  const [resume,  setResume]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: statsData } = await API.get('/applications/stats/overview');
        setStats(statsData.stats);
        if (user?.role === 'seeker') {
          try {
            const { data: resumeData } = await API.get('/resume/my');
            setResume(resumeData.resume);
          } catch { /* no resume yet */ }
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  if (loading) return (
    <div className="container" style={{ paddingTop: 60 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      <div className="container" style={{ paddingTop: 40 }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 32, marginBottom: 6 }}>
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            {user?.role === 'seeker'
              ? 'Here\'s your job search overview'
              : 'Here\'s your recruitment overview'}
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 32 }}>
            {user?.role === 'seeker' ? (
              <>
                <StatCard icon="📋" label="Total Applications"  value={stats.total}       color="var(--accent)" />
                <StatCard icon="⏳" label="Pending"             value={stats.pending}     color="var(--yellow)" />
                <StatCard icon="⭐" label="Shortlisted"         value={stats.shortlisted} color="var(--accent2)" />
                <StatCard icon="✅" label="Accepted"            value={stats.accepted}    color="var(--green)" />
              </>
            ) : (
              <>
                <StatCard icon="💼" label="Total Jobs Posted"  value={stats.totalJobs}         color="var(--accent)" />
                <StatCard icon="🟢" label="Open Jobs"          value={stats.openJobs}          color="var(--green)" />
                <StatCard icon="📨" label="Total Applications" value={stats.totalApplications} color="var(--accent2)" />
              </>
            )}
          </div>
        )}

        {/* ── SEEKER SECTION ── */}
        {user?.role === 'seeker' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* AI Suggestions Banner — shown when resume exists */}
            {resume && (
              <div style={{
                borderRadius: 16, padding: '24px 28px',
                background: 'linear-gradient(135deg, rgba(79,142,247,.12), rgba(124,92,252,.12))',
                border: '1px solid rgba(79,142,247,.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 16
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 24 }}>🤖</span>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 18 }}>AI Job Suggestions Ready</h3>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 460, lineHeight: 1.6 }}>
                    Your resume has been analysed. Let AI compare your{' '}
                    <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                      {resume.parsedData?.skills?.length || 0} detected skills
                    </span>
                    {' '}against all open jobs and find your best matches.
                  </p>
                </div>
                <Link to="/ai-suggestions">
                  <button className="btn btn-primary" style={{ fontSize: 15, padding: '12px 24px', whiteSpace: 'nowrap' }}>
                    ✨ Get AI Job Suggestions
                  </button>
                </Link>
              </div>
            )}

            {/* No resume — upload prompt */}
            {!resume && (
              <div style={{
                borderRadius: 16, padding: '24px 28px',
                background: 'rgba(245,158,11,.06)',
                border: '1px solid rgba(245,158,11,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 16
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 24 }}>📄</span>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 18 }}>Upload resume to unlock AI features</h3>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                    Upload your PDF resume to get AI job suggestions, match explanations, and resume improvements.
                  </p>
                </div>
                <Link to="/upload-resume">
                  <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    Upload Resume →
                  </button>
                </Link>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Resume status card */}
              <div className="card">
                <h3 style={{ fontFamily: 'Syne', marginBottom: 16 }}>Resume Status</h3>
                {resume ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'rgba(34,197,94,.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                      }}>📄</div>
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 2, fontSize: 14 }}>{resume.fileName}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {new Date(resume.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Active</span>
                    </div>
                    {resume.parsedData?.skills?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>DETECTED SKILLS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {resume.parsedData.skills.slice(0, 6).map(s => (
                            <span key={s} style={{
                              padding: '3px 9px', borderRadius: 999, fontSize: 11,
                              background: 'rgba(79,142,247,.1)', color: 'var(--accent)',
                              border: '1px solid rgba(79,142,247,.2)'
                            }}>{s}</span>
                          ))}
                          {resume.parsedData.skills.length > 6 && (
                            <span style={{ fontSize: 11, color: 'var(--muted)', padding: '3px 6px' }}>
                              +{resume.parsedData.skills.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <Link to="/upload-resume">
                      <button className="btn btn-outline btn-sm btn-full" style={{ marginTop: 14 }}>
                        Update Resume
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 13 }}>
                      No resume uploaded yet.
                    </p>
                    <Link to="/upload-resume">
                      <button className="btn btn-primary">Upload Resume →</button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Quick links */}
              <div className="card">
                <h3 style={{ fontFamily: 'Syne', marginBottom: 16 }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { to: '/ai-suggestions',  icon: '🤖', label: 'AI Job Suggestions',  desc: 'Get personalized recommendations', highlight: !!resume },
                    { to: '/',                icon: '🔍', label: 'Browse All Jobs',      desc: 'Find latest opportunities' },
                    { to: '/my-applications', icon: '📋', label: 'My Applications',      desc: 'Track application status' },
                    { to: '/upload-resume',   icon: '📄', label: 'Update Resume',        desc: 'Keep your CV up to date' },
                  ].map(item => (
                    <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${item.highlight ? 'var(--accent)' : 'var(--border)'}`,
                        background: item.highlight ? 'rgba(79,142,247,.05)' : 'var(--surface2)',
                        transition: 'all .2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = item.highlight ? 'var(--accent)' : 'var(--border)'}>
                        <span style={{ fontSize: 18 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.desc}</div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 14 }}>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RECRUITER SECTION ── */}
        {user?.role === 'recruiter' && (
          <div className="card">
            <h3 style={{ fontFamily: 'Syne', marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
              {[
                { to: '/post-job', icon: '➕', label: 'Post New Job',    desc: 'Create a job listing' },
                { to: '/my-jobs',  icon: '💼', label: 'Manage Jobs',     desc: 'View & edit your jobs' },
                { to: '/',         icon: '🔍', label: 'Browse All Jobs', desc: 'See all listings' },
              ].map(item => (
                <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '18px', borderRadius: 12, border: '1px solid var(--border)',
                    background: 'var(--surface2)', transition: 'all .2s',
                    cursor: 'pointer', textAlign: 'center'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.transform = ''; }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
