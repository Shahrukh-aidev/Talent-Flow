// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const active = (path) =>
    location.pathname === path ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' } : {};

  return (
    <nav style={{
      background:    'var(--surface)',
      borderBottom:  '1px solid var(--border)',
      position:      'sticky', top: 0, zIndex: 100,
      backdropFilter:'blur(12px)'
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', height:62, gap:32 }}>
        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{
            width:34, height:34, borderRadius:10,
            background:'linear-gradient(135deg,var(--accent),var(--accent2))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, fontWeight:800, color:'#fff', fontFamily:'Syne'
          }}>R</div>
          <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:18, color:'var(--text)' }}>
            RecruitPro
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{ display:'flex', gap:4, flex:1 }}>
          <NavLink to="/" style={active('/')}>Jobs</NavLink>
          {user?.role === 'seeker' && <>
            <NavLink to="/dashboard" style={active('/dashboard')}>Dashboard</NavLink>
            <NavLink to="/upload-resume" style={active('/upload-resume')}>Resume</NavLink>
            <NavLink to="/my-applications" style={active('/my-applications')}>Applications</NavLink>
          </>}
          {user?.role === 'recruiter' && <>
            <NavLink to="/dashboard" style={active('/dashboard')}>Dashboard</NavLink>
            <NavLink to="/post-job" style={active('/post-job')}>Post Job</NavLink>
            <NavLink to="/my-jobs" style={active('/my-jobs')}>My Jobs</NavLink>
          </>}
        </div>

        {/* Auth */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {user ? (
            <>
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'6px 12px', background:'var(--surface2)',
                borderRadius:999, fontSize:13
              }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%',
                  background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:700, color:'#fff'
                }}>{user.name?.charAt(0).toUpperCase()}</div>
                <span style={{ color:'var(--muted)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user.name}
                </span>
                <span className="badge badge-blue" style={{ fontSize:11 }}>{user.role}</span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">  <button className="btn btn-outline btn-sm">Login</button></Link>
              <Link to="/register"><button className="btn btn-primary btn-sm">Sign Up</button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, children, style }) {
  return (
    <Link to={to} style={{
      padding: '6px 14px', borderRadius: 8, fontSize: 14,
      color: 'var(--muted)', textDecoration: 'none',
      transition: 'color .15s', paddingBottom: 8,
      ...style
    }}
    onMouseEnter={e => { if (!style?.color) e.target.style.color='var(--text)'; }}
    onMouseLeave={e => { if (!style?.color) e.target.style.color='var(--muted)'; }}
    >{children}</Link>
  );
}
