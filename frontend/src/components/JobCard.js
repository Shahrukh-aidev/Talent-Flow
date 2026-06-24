// src/components/JobCard.js
import React from 'react';
import { Link } from 'react-router-dom';

const TYPE_COLORS = {
  'full-time':  'badge-green',
  'part-time':  'badge-yellow',
  'contract':   'badge-blue',
  'internship': 'badge-purple',
};

export default function JobCard({ job }) {
  const daysAgo = Math.floor(
    (new Date() - new Date(job.posted_at)) / (1000 * 60 * 60 * 24)
  );

  const skills = job.skills_required
    ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="card" style={{ transition: 'transform .2s, box-shadow .2s' }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,142,247,.15)';
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div>
          <h3 style={{ fontSize:17, marginBottom:4, fontFamily:'Syne' }}>{job.title}</h3>
          <div style={{ fontSize:13, color:'var(--muted)', display:'flex', gap:12, flexWrap:'wrap' }}>
            <span>🏢 {job.company_name || 'Company'}</span>
            <span>📍 {job.location || 'Remote'}</span>
            {job.experience_years > 0 && <span>🎓 {job.experience_years}+ yrs</span>}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
          <span className={`badge ${TYPE_COLORS[job.job_type] || 'badge-blue'}`}>
            {job.job_type}
          </span>
          {job.salary_min && (
            <span style={{ fontSize:12, color:'var(--green)', fontWeight:500 }}>
              PKR {Number(job.salary_min).toLocaleString()}
              {job.salary_max && ` – ${Number(job.salary_max).toLocaleString()}`}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize:13, color:'var(--muted)', marginBottom:14, lineHeight:1.6,
        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
        {job.description}
      </p>

      {/* Skills */}
      {skills.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
          {skills.slice(0, 6).map(skill => (
            <span key={skill} style={{
              padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:500,
              background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)'
            }}>{skill}</span>
          ))}
          {skills.length > 6 && (
            <span style={{ padding:'3px 10px', fontSize:11, color:'var(--muted)' }}>
              +{skills.length - 6} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12, color:'var(--muted)' }}>
          {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
        </span>
        <Link to={`/jobs/${job.id}`}>
          <button className="btn btn-primary btn-sm">View Details →</button>
        </Link>
      </div>
    </div>
  );
}
