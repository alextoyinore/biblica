import React from 'react';

const HelpPanel = ({ onClose }) => {
  return (
    <div className="help-page" style={{ padding: '60px 80px', maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease', height: '100%', overflowY: 'auto' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '60px' }}>
        <button onClick={onClose} className="back-nav">← Back</button>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-gold)', letterSpacing: '8px', fontWeight: '800', textTransform: 'uppercase' }}>Help & Guide</h2>
      </header>

      <section style={{ marginBottom: '50px' }}>
        <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Keyboard Shortcuts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Shortcut keys={['Ctrl', '1']} action="Open Reader" />
          <Shortcut keys={['Ctrl', '2']} action="Open Dashboard" />
          <Shortcut keys={['Ctrl', 'L']} action="Open Library" />
          <Shortcut keys={['Ctrl', 'R']} action="Reading Plans" />
          <Shortcut keys={['Ctrl', 'P']} action="Prayer Journal" />
          <Shortcut keys={['Ctrl', 'F']} action="Search Scripture" />
          <Shortcut keys={['Ctrl', ',']} action="Open Settings" />
          <Shortcut keys={['Ctrl', '\\']} action="Toggle Split View" />
          <Shortcut keys={['Ctrl', 'Space']} action="Read Aloud (TTS)" />
          <Shortcut keys={['Ctrl', 'G']} action="Passage Picker" />
          <Shortcut keys={['Ctrl', 'Right']} action="Next Chapter" />
          <Shortcut keys={['Ctrl', 'Left']} action="Previous Chapter" />
          <Shortcut keys={['Esc']} action="Close Menus / Popups" />
        </div>
      </section>

      <section style={{ marginBottom: '50px' }}>
        <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>How to Use Biblica</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GuideItem title="Navigation" desc="Use the top title bar to access different modules. The side navigation arrows or your mouse drag can be used to quickly jump between chapters." />
          <GuideItem title="Study Tools" desc="Click on any verse to open the study menu. From there you can bookmark the verse, highlight it with a custom color, add study notes, view commentaries, or generate shareable art." />
          <GuideItem title="Split View" desc="Toggle Split View from the menu to read two different translations side-by-side. You can select the secondary translation from the top header." />
          <GuideItem title="Ambient Audio" desc="Enhance your focus by enabling ambient background sounds (like Rain or Forest) from the audio controller in the top header. You can also have the app read the scripture aloud using the play button." />
        </div>
      </section>
      
      <div style={{ paddingBottom: '60px' }} />
    </div>
  );
};

const Shortcut = ({ keys, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--accent-soft)' }}>
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{action}</span>
    <div style={{ display: 'flex', gap: '6px' }}>
      {keys.map((k, i) => (
        <span key={i} style={{ padding: '4px 8px', background: 'var(--bg-deep)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-primary)', border: '1px solid var(--accent-soft)', fontWeight: '600', fontFamily: 'monospace' }}>
          {k}
        </span>
      ))}
    </div>
  </div>
);

const GuideItem = ({ title, desc }) => (
  <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '12px', borderLeft: '3px solid var(--accent-gold)' }}>
    <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '8px' }}>{title}</h4>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>{desc}</p>
  </div>
);

export default HelpPanel;
