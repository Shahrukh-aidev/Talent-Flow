// src/App.js — Updated with AI Suggestions route
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar         from './components/Navbar';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Jobs           from './pages/Jobs';
import JobDetail      from './pages/JobDetail';
import Dashboard      from './pages/Dashboard';
import ResumeUpload   from './pages/ResumeUpload';
import MyApplications from './pages/MyApplications';
import PostJob        from './pages/PostJob';
import MyJobs         from './pages/MyJobs';
import AISuggestions  from './pages/AISuggestions';   // ← NEW
import './index.css';

function Private({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'var(--muted)' }}>Loading…</div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"               element={<Jobs />} />
        <Route path="/jobs/:id"       element={<JobDetail />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />

        {/* Shared protected */}
        <Route path="/dashboard" element={<Private><Dashboard /></Private>} />

        {/* Seeker only */}
        <Route path="/upload-resume"   element={<Private role="seeker"><ResumeUpload /></Private>} />
        <Route path="/my-applications" element={<Private role="seeker"><MyApplications /></Private>} />
        <Route path="/ai-suggestions"  element={<Private role="seeker"><AISuggestions /></Private>} />

        {/* Recruiter only */}
        <Route path="/post-job" element={<Private role="recruiter"><PostJob /></Private>} />
        <Route path="/my-jobs"  element={<Private role="recruiter"><MyJobs /></Private>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
