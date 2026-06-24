// src/pages/JobDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function JobDetail() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [job,         setJob]         = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [applying,    setApplying]    = useState(false);
  const [applied,     setApplied]     = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [toast,       setToast]       = useState(null);

  useEffect(() => {
    API.get(`/jobs/${id}`)
      .then(({ data }) => setJob(data.job))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const apply = async () => {
    if (!user) { navigate('/login'); return; }
    setApplying(true);
    try {
      const { data } = await API.post('/applications', {
        job_id: id, cover_letter: coverLetter
      });
      setApplied(true);
      setShowModal(false);
      setToast({
        message: `Applied! Match score: ${data.matchScore}%`,
        type: 'success'
      });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Apply failed.', type: 'error' });
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ paddingTop:60 }}>
      <div className="skeleton" style={{ height:400, borderRadius:16 }} />
    </div>
  );
  if (!job) return null;

  const skills = job.skills_required
    ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div style={{ minHeight:'100vh', paddingBottom:60 }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Apply Modal */}
      {showModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:200,
          display:'flex', alignItems:'center', justifyContent:'center', padding:24
        }}>
          <div className="card" style={{ maxWidth:520, width:'100%' }}>
            <h3 style={{ fontFamily:'Syne', marginBottom:6 }}>Apply for: {job.title}</h3>
            <p style={{ color:'var(--muted)', fontSize:13, marginBottom:20 }}>
              Write a cover letter (optional but recommended)
            </p>
            <textarea
              rows={6} placeholder="Tell the recruiter why you're a great fit for this role…"
              value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
              style={{ marginBottom:16, resize:'vertical' }}
            />
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={apply} disabled={applying}>
                {applying ? 'Submitting…' : '🚀 Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container" style={{ paddingTop:40 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}
          style={{ marginBottom:24 }}>← Back</button>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>
          {/* Main */}
          <div>
            <div className="card" style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div>
                  <h1 style={{ fontFamily:'Syne', fontSize:28, marginBottom:8 }}>{job.title}</h1>
                  <div style={{ display:'flex', gap:16, flexWrap:'wrap', color:'var(--muted)', fontSize:14 }}>
                    <span>🏢 {job.company_name || 'Company'}</span>
                    <span>📍 {job.location}</span>
                    <span>💼 {job.job_type}</span>
                    {job.experience_years > 0 && <span>🎓 {job.experience_years}+ years exp</span>}
                  </div>
                </div>
                {job.salary_min && (
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:20, fontWeight:700, color:'var(--green)', fontFamily:'Syne' }}>
                      PKR {Number(job.salary_min).toLocaleString()}
                    </div>
                    {job.salary_max && (
                      <div style={{ fontSize:13, color:'var(--muted)' }}>
                        – {Number(job.salary_max).toLocaleString()} / month
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ borderTop:'1px solid var(--border)', paddingTop:20 }}>
                <h3 style={{ marginBottom:12, fontSize:16 }}>Job Description</h3>
                <p style={{ color:'var(--muted)', lineHeight:1.8, whiteSpace:'pre-wrap', fontSize:14 }}>
                  {job.description}
                </p>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom:14, fontSize:16 }}>Required Skills</h3>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {skills.map(skill => (
                    <span key={skill} style={{
                      padding:'6px 14px', borderRadius:999, fontSize:13, fontWeight:500,
                      background:'rgba(79,142,247,.1)', border:'1px solid rgba(79,142,247,.3)',
                      color:'var(--accent)'
                    }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Apply Card */}
            <div className="card">
              {user?.role === 'seeker' ? (
                applied ? (
                  <div style={{ textAlign:'center', padding:'8px 0' }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
                    <h3 style={{ color:'var(--green)', marginBottom:4 }}>Applied!</h3>
                    <p style={{ color:'var(--muted)', fontSize:13 }}>
                      Your application has been submitted.
                    </p>
                  </div>
                ) : (
                  <>
                    <button className="btn btn-primary btn-full"
                      style={{ fontSize:16, padding:'14px' }}
                      onClick={() => setShowModal(true)}>
                      🚀 Apply Now
                    </button>
                    <p style={{ textAlign:'center', fontSize:12, color:'var(--muted)', marginTop:10 }}>
                      Your resume will be matched against this job
                    </p>
                  </>
                )
              ) : !user ? (
                <button className="btn btn-primary btn-full"
                  onClick={() => navigate('/login')}>
                  Login to Apply
                </button>
              ) : (
                <div style={{ textAlign:'center', color:'var(--muted)', fontSize:13 }}>
                  Recruiter accounts cannot apply.
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="card">
              <h3 style={{ marginBottom:14, fontSize:15 }}>Job Details</h3>
              {[
                { label:'Posted',     value: new Date(job.posted_at).toLocaleDateString() },
                { label:'Deadline',   value: job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Open' },
                { label:'Type',       value: job.job_type },
                { label:'Location',   value: job.location || 'Remote' },
                { label:'Experience', value: job.experience_years > 0 ? `${job.experience_years}+ years` : 'Fresher OK' },
                { label:'Industry',   value: job.industry || 'Technology' },
              ].map(item => (
                <div key={item.label} style={{
                  display:'flex', justifyContent:'space-between', paddingBottom:10,
                  borderBottom:'1px solid var(--border)', marginBottom:10,
                  fontSize:13
                }}>
                  <span style={{ color:'var(--muted)' }}>{item.label}</span>
                  <span style={{ fontWeight:500 }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Company */}
            {job.company_name && (
              <div className="card">
                <h3 style={{ marginBottom:10, fontSize:15 }}>About Company</h3>
                <div style={{ fontWeight:600, marginBottom:4 }}>{job.company_name}</div>
                {job.industry && <div style={{ color:'var(--muted)', fontSize:13, marginBottom:6 }}>{job.industry}</div>}
                {job.company_description && (
                  <p style={{ color:'var(--muted)', fontSize:13, lineHeight:1.6 }}>
                    {job.company_description}
                  </p>
                )}
                {job.website && (
                  <a href={job.website} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:13, display:'block', marginTop:8 }}>
                    🌐 Visit Website
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
