// src/components/StatCard.js
import React from 'react';

export default function StatCard({ icon, label, value, color = 'var(--accent)' }) {
  return (
    <div className="card" style={{ display:'flex', alignItems:'center', gap:18 }}>
      <div style={{
        width:52, height:52, borderRadius:14,
        background: `${color}22`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:24, flexShrink:0
      }}>{icon}</div>
      <div>
        <div style={{ fontSize:28, fontWeight:700, fontFamily:'Syne', color }}>{value}</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>{label}</div>
      </div>
    </div>
  );
}
