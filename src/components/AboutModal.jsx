import React from 'react';

const AboutModal = ({ onClose }) => {
  return (
    <div className="about-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div className="about-modal" style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--accent-soft)',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }} onClick={e => e.stopPropagation()}>

        <button onClick={onClose} style={{
          position: 'absolute', top: '15px', right: '15px',
          background: 'none', border: 'none',
          color: 'var(--text-muted)', fontSize: '1.5rem',
          cursor: 'pointer', transition: 'color 0.2s'
        }}>&times;</button>

        <h1 style={{ fontSize: '1.2rem', color: 'var(--accent-gold)', letterSpacing: '4px', fontWeight: '800', marginBottom: '10px' }}>BIBLICA</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '30px' }}>Version 1.0.0</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '2px', fontWeight: '700' }}>Author</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>Alexander Ore</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '2px', fontWeight: '700' }}>Company</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>ProjectStar Technologies, Nigeria</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '2px', fontWeight: '700' }}>Description</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>A full-featured bible study application. Designed for clarity, focus, and deep study.</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--accent-soft)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>&copy; {new Date().getFullYear()} ProjectStar Technologies Nigeria. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
