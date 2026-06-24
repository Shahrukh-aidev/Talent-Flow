// src/pages/MyJobs.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Toast from '../components/Toast';

const STATUS_CONFIG = {
  pending:     { label:'Pending',     class:'badge-yellow' },
  reviewed:    { label:'Reviewed',    class:'badge-blue' },
  shortlisted: { label:'Shortlisted', class:'badge-purple' },
  accepted:    { label:'Accepted',    class:'badge-green' },
  rejected:    { label:'Rejected',    class:'badge-red' },
};

export default function MyJobs() {
  const [jobs,         setJobs]         = useState([]);
  const [selectedJob,  setSelectedJob]  = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [appLoading,   setAppLoading]   = useState(false);
  const [toast,        setToast]        = useState(null);

  useEffect(() => {
    API.get('/jobs/recruiter/my')
      .then(({ data }) => setJobs(data.jobs))
      .finally(() => setLoading(false));
  }, []);

  const viewApplications = async (job) => {
    setSelectedJob(job);
    setAppLoading(true);
    try {
      const { data } = await API.get(`/applications/job/${job.id}`);
      setApplications(data.applications);
    } catch { setApplications([]); }
    finally { setAppLoading(false); }
  };

  const updateStatus = async (appId, status) => {
    try {
      await API.put(`/applications/${appId}/status`, { status });
      setApplications(apps =>
        apps.map(a => a.id === appId ? { ...a, status } : a)
      );
      setToast({ message: `Status updated to "${status}"`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to update status.', type: 'error' });
    }
  };

  const toggleJobStatus = async (job) => {
    const newStatus = job.status === 'open' ? 'closed' : 'open';
    await API.put(`/jobs/${job.id}`, { ...job, status: newStatus });
    setJobs(jobs => jobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
  };

  if (loading) return (
    <div className="container" style={{ paddingTop:60 }}>
      {[1,2].map(i => <div key={i} className="skeleton" style={{ height:120, borderRadius:16, marginBottom:16 }} />)}
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', paddingBottom:60 }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="container" style={{ paddingTop:40 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:'Syne', fontSize:30, marginBottom:4 }}>My Job Listings</h1>
            <p style={{ color:'var(--muted)' }}>{jobs.length} jobs posted</p>
          </div>
          <Link to="/post-job"><button className="btn btn-primary">+ Post New Job</button></Link>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: selectedJob ? '1fr 1.4fr' : '1fr', gap:24 }}>
          {/* Jobs list */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {jobs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'var(--muted)' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>💼</div>
                <p style={{ marginBottom:16 }}>No jobs posted yet</p>
                <Link to="/post-job"><button className="btn btn-primary">Post Your First Job</button></Link>
              </div>
            ) : jobs.map(job => (
              <div key={job.id} className="card"
                style={{ borderColor: selectedJob?.id === job.id ? 'var(--accent)' : 'var(--border)',
                  cursor:'pointer', transition:'all .2s' }}
                onClick={() => viewApplications(job)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <h3 style={{ fontFamily:'Syne', fontSize:16, marginBottom:6 }}>{job.title}</h3>
                    <div style={{ fontSize:13, color:'var(--muted)', display:'flex', gap:10 }}>
                      <span>📍 {job.location || 'Remote'}</span>
                      <span>💼 {job.job_type}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                    <span className={`badge ${job.status === 'open' ? 'badge-green' : 'badge-red'}`}>
                      {job.status}
                    </span>
                    <span className="badge badge-blue">
                      {job.application_count || 0} applicants
                    </span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, marginTop:14 }}>
                  <button className="btn btn-outline btn-sm"
                    onClick={e => { e.stopPropagation(); toggleJobStatus(job); }}>
                    {job.status === 'open' ? 'Close Job' : 'Reopen Job'}
                  </button>
                  <button className="btn btn-primary btn-sm"
                    onClick={e => { e.stopPropagation(); viewApplications(job); }}>
                    View Applicants →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Applicants panel */}
          {selectedJob && (
            <div className="card" style={{ alignSelf:'start', position:'sticky', top:80 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h3 style={{ fontFamily:'Syne' }}>Applicants for: {selectedJob.title}</h3>
                <button className="btn btn-outline btn-sm" onClick={() => setSelectedJob(null)}>✕</button>
              </div>

              {appLoading ? (
                <div style={{ color:'var(--muted)', textAlign:'center', padding:30 }}>Loading…</div>
              ) : applications.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)' }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
                  <p>No applications yet</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12, maxHeight:600, overflowY:'auto' }}>
                  {applications.map(app => {
                    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                    return (
                      <div key={app.id} style={{
                        padding:14, borderRadius:12, border:'1px solid var(--border)',
                        background:'var(--surface2)'
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                          <div>
                            <div style={{ fontWeight:600, fontSize:14 }}>{app.seeker_name}</div>
                            <div style={{ fontSize:12, color:'var(--muted)' }}>{app.seeker_email}</div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                            <div style={{ fontSize:11, color:'var(--accent)', marginTop:4 }}>
                              {Math.round(app.match_score)}% match
                            </div>
                          </div>
                        </div>

                        {/* Skills from resume */}
                        {app.resume?.parsedData?.skills?.length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
                            {app.resume.parsedData.skills.slice(0,5).map(s => (
                              <span key={s} style={{
                                padding:'2px 8px', borderRadius:999, fontSize:10,
                                background:'rgba(79,142,247,.1)', color:'var(--accent)'
                              }}>{s}</span>
                            ))}
                          </div>
                        )}

                        {/* Status update */}
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {['shortlisted','accepted','rejected'].map(s => (
                            <button key={s}
                              className={`btn btn-sm ${app.status === s ? 'btn-primary' : 'btn-outline'}`}
                              style={{ fontSize:11, padding:'4px 10px' }}
                              onClick={() => updateStatus(app.id, s)}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
