// src/pages/PostJob.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Toast from '../components/Toast';

export default function PostJob() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [toast,     setToast]     = useState(null);
  const [loading,   setLoading]   = useState(false);

  const [form, setForm] = useState({
    company_id: '', title: '', description: '', location: '',
    job_type: 'full-time', salary_min: '', salary_max: '',
    skills_required: '', experience_years: 0, deadline: ''
  });

  useEffect(() => {
    API.get('/companies/my').then(({ data }) => setCompanies(data.companies)).catch(() => {});
  }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/jobs', form);
      setToast({ message: 'Job posted successfully!', type: 'success' });
      setTimeout(() => navigate('/my-jobs'), 1200);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to post job.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', paddingBottom:60 }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="container" style={{ paddingTop:40, maxWidth:760 }}>
        <h1 style={{ fontFamily:'Syne', fontSize:30, marginBottom:8 }}>Post a New Job</h1>
        <p style={{ color:'var(--muted)', marginBottom:32 }}>
          Fill in the details below to create a new job listing.
        </p>

        <form onSubmit={submit} className="card">
          {/* Basic Info */}
          <h3 style={{ fontFamily:'Syne', marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
            Basic Information
          </h3>

          <div className="form-group">
            <label>JOB TITLE *</label>
            <input name="title" placeholder="e.g., Senior React Developer"
              value={form.title} onChange={handle} required />
          </div>

          {companies.length > 0 && (
            <div className="form-group">
              <label>COMPANY</label>
              <select name="company_id" value={form.company_id} onChange={handle}>
                <option value="">Select company…</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>JOB DESCRIPTION *</label>
            <textarea name="description" rows={6}
              placeholder="Describe the role, responsibilities, and what you're looking for…"
              value={form.description} onChange={handle} required
              style={{ resize:'vertical' }} />
          </div>

          {/* Details */}
          <h3 style={{ fontFamily:'Syne', marginBottom:18, marginTop:8, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
            Job Details
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label>LOCATION</label>
              <input name="location" placeholder="Karachi / Remote / Lahore"
                value={form.location} onChange={handle} />
            </div>
            <div className="form-group">
              <label>JOB TYPE</label>
              <select name="job_type" value={form.job_type} onChange={handle}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>MIN SALARY (PKR)</label>
              <input name="salary_min" type="number" placeholder="80000"
                value={form.salary_min} onChange={handle} />
            </div>
            <div className="form-group">
              <label>MAX SALARY (PKR)</label>
              <input name="salary_max" type="number" placeholder="150000"
                value={form.salary_max} onChange={handle} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>EXPERIENCE (YEARS)</label>
              <input name="experience_years" type="number" min={0} max={20}
                value={form.experience_years} onChange={handle} />
            </div>
            <div className="form-group">
              <label>APPLICATION DEADLINE</label>
              <input name="deadline" type="date" value={form.deadline} onChange={handle} />
            </div>
          </div>

          {/* Skills */}
          <h3 style={{ fontFamily:'Syne', marginBottom:18, marginTop:8, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
            Required Skills
          </h3>

          <div className="form-group">
            <label>SKILLS (comma separated)</label>
            <input name="skills_required"
              placeholder="React, Node.js, MySQL, MongoDB, JavaScript"
              value={form.skills_required} onChange={handle} />
            <span style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
              These will be matched against candidate resumes for a match score
            </span>
          </div>

          {/* Preview skills */}
          {form.skills_required && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
              {form.skills_required.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                <span key={s} style={{
                  padding:'3px 10px', borderRadius:999, fontSize:12,
                  background:'rgba(79,142,247,.1)', color:'var(--accent)',
                  border:'1px solid rgba(79,142,247,.3)'
                }}>{s}</span>
              ))}
            </div>
          )}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}
            style={{ fontSize:16, padding:'14px' }}>
            {loading ? 'Posting…' : '🚀 Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
}
