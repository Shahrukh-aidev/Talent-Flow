// src/pages/Jobs.js
import React, { useEffect, useState, useCallback } from 'react';
import API from '../api/axios';
import JobCard from '../components/JobCard';

export default function Jobs() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [filters, setFilters] = useState({ search: '', location: '', type: '' });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9, ...filters };
      const { data } = await API.get('/jobs', { params });
      setJobs(data.jobs);
      setTotal(data.total);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleFilter = (e) => {
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const totalPages = Math.ceil(total / 9);

  return (
    <div style={{ minHeight:'100vh', paddingBottom:60 }}>
      {/* Hero */}
      <div style={{
        background:'linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)',
        borderBottom:'1px solid var(--border)', padding:'60px 0 40px'
      }}>
        <div className="container">
          <h1 style={{ fontFamily:'Syne', fontSize:42, marginBottom:10, lineHeight:1.1 }}>
            Find Your Next<br/>
            <span style={{ background:'linear-gradient(90deg,var(--accent),var(--accent2))',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Opportunity
            </span>
          </h1>
          <p style={{ color:'var(--muted)', fontSize:16, marginBottom:32 }}>
            {total} jobs available right now
          </p>

          {/* Filters */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 200px 180px', gap:12, maxWidth:720 }}>
            <input
              name="search" placeholder="🔍  Search jobs, skills, companies…"
              value={filters.search} onChange={handleFilter}
              style={{ padding:'12px 18px' }}
            />
            <input
              name="location" placeholder="📍 Location"
              value={filters.location} onChange={handleFilter}
            />
            <select name="type" value={filters.type} onChange={handleFilter}>
              <option value="">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Grid */}
      <div className="container" style={{ paddingTop:40 }}>
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton" style={{ height:220, borderRadius:16 }} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'var(--muted)' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
            <h3 style={{ marginBottom:8 }}>No jobs found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
              {jobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:40 }}>
                <button className="btn btn-outline btn-sm"
                  disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p}
                    className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="btn btn-outline btn-sm"
                  disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
