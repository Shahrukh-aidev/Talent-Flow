// src/pages/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      setToast({ message: `Welcome back, ${user.name}!`, type: 'success' });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Login failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Demo login helpers
  const demoLogin = async (role) => {
    setForm({
      email:    role === 'seeker' ? 'seeker@demo.com' : 'recruiter@demo.com',
      password: 'password'
    });
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'radial-gradient(ellipse at 60% 20%, rgba(79,142,247,.08) 0%, var(--bg) 60%)' }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div style={{ width:'100%', maxWidth:440, padding:'0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{
            width:56, height:56, borderRadius:16, margin:'0 auto 16px',
            background:'linear-gradient(135deg,var(--accent),var(--accent2))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:28, fontWeight:800, color:'#fff', fontFamily:'Syne'
          }}>R</div>
          <h1 style={{ fontSize:28, fontFamily:'Syne', marginBottom:6 }}>Welcome Back</h1>
          <p style={{ color:'var(--muted)', fontSize:14 }}>Sign in to your RecruitPro account</p>
        </div>

        {/* Demo buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
          {['seeker','recruiter'].map(role => (
            <button key={role} className="btn btn-outline btn-sm"
              onClick={() => demoLogin(role)}
              style={{ justifyContent:'center' }}>
              👤 Demo {role.charAt(0).toUpperCase()+role.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ textAlign:'center', color:'var(--muted)', fontSize:12, marginBottom:20,
          display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          or sign in manually
          <div style={{ flex:1, height:1, background:'var(--border)' }}/>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="card">
          <div className="form-group">
            <label>EMAIL ADDRESS</label>
            <input name="email" type="email" placeholder="you@example.com"
              value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label>PASSWORD</label>
            <input name="password" type="password" placeholder="••••••••"
              value={form.password} onChange={handle} required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}
            style={{ marginTop:8 }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'var(--muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'var(--accent)', fontWeight:500 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
