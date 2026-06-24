// src/pages/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'seeker', phone: '', location: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters.', type: 'error' }); return;
    }
    setLoading(true);
    try {
      await register(form);
      setToast({ message: 'Account created successfully!', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Registration failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'radial-gradient(ellipse at 40% 80%, rgba(124,92,252,.08) 0%, var(--bg) 60%)',
      padding:'40px 24px' }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div style={{ width:'100%', maxWidth:520 }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <h1 style={{ fontSize:28, fontFamily:'Syne', marginBottom:6 }}>Create Account</h1>
          <p style={{ color:'var(--muted)', fontSize:14 }}>Join RecruitPro as a job seeker or recruiter</p>
        </div>

        {/* Role selector */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
          {[
            { value:'seeker',    label:'🔍 Job Seeker',  desc:'Find your dream job' },
            { value:'recruiter', label:'🏢 Recruiter',   desc:'Hire top talent' },
          ].map(opt => (
            <div key={opt.value}
              onClick={() => setForm({ ...form, role: opt.value })}
              style={{
                padding:'16px', borderRadius:14, cursor:'pointer', transition:'all .2s',
                border: `2px solid ${form.role === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                background: form.role === opt.value ? 'rgba(79,142,247,.08)' : 'var(--surface)',
              }}>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>{opt.label}</div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>{opt.desc}</div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="card" style={{ display:'flex', flexDirection:'column', gap:0 }}>
          <div className="form-row">
            <div className="form-group">
              <label>FULL NAME</label>
              <input name="name" placeholder="Ali Hassan" value={form.name} onChange={handle} required />
            </div>
            <div className="form-group">
              <label>EMAIL</label>
              <input name="email" type="email" placeholder="ali@email.com" value={form.email} onChange={handle} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>PASSWORD</label>
              <input name="password" type="password" placeholder="Min 6 chars" value={form.password} onChange={handle} required />
            </div>
            <div className="form-group">
              <label>PHONE</label>
              <input name="phone" placeholder="+92 300 1234567" value={form.phone} onChange={handle} />
            </div>
          </div>
          <div className="form-group">
            <label>LOCATION</label>
            <input name="location" placeholder="Karachi, Pakistan" value={form.location} onChange={handle} />
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}
            style={{ marginTop:8 }}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--accent)', fontWeight:500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
