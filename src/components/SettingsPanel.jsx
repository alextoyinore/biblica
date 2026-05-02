import React from 'react';

const SettingsPanel = ({ settings, onUpdateSettings, onClose }) => {
  const update = (key, value) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="settings-page" style={{ padding: '60px 80px', maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '80px' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-gold)', letterSpacing: '8px', fontWeight: '800', textTransform: 'uppercase' }}>Settings</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
      </header>

      <section className="settings-section" style={{ marginBottom: '60px' }}>
        <h3 className="setting-label">Theme</h3>
        <div className="theme-options" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          {['modern-sacred', 'sepia', 'light'].map(t => (
            <button 
              key={t}
              onClick={() => update('theme', t)}
              className={`theme-btn ${settings.theme === t ? 'active' : ''}`}
              style={{
                flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid var(--accent-soft)',
                background: settings.theme === t ? 'var(--accent-gold)' : 'transparent',
                color: settings.theme === t ? '#000' : 'var(--text-primary)',
                textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section" style={{ marginBottom: '60px' }}>
        <h3 className="setting-label">Highlight Intensity</h3>
        <div className="intensity-options" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          {['light', 'heavy'].map(style => (
            <button 
              key={style}
              onClick={() => update('highlightStyle', style)}
              className={`style-btn ${settings.highlightStyle === style ? 'active' : ''}`}
              style={{
                flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid var(--accent-soft)',
                background: (settings.highlightStyle || 'heavy') === style ? 'var(--accent-gold)' : 'transparent',
                color: (settings.highlightStyle || 'heavy') === style ? '#000' : 'var(--text-primary)',
                textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              {style === 'light' ? 'Luminous (Soft)' : 'Deep (Heavy)'}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section" style={{ marginBottom: '60px' }}>
        <h3 className="setting-label">Font Size ({settings.fontSize}rem)</h3>
        <input 
          type="range" min="0.8" max="2.5" step="0.1" 
          value={settings.fontSize} onChange={(e) => update('fontSize', parseFloat(e.target.value))}
          className="slim-slider"
        />
      </section>

      <section className="settings-section">
        <h3 className="setting-label">Line Height ({settings.lineHeight}x)</h3>
        <input 
          type="range" min="1.2" max="5.0" step="0.1" 
          value={settings.lineHeight} onChange={(e) => update('lineHeight', parseFloat(e.target.value))}
          className="slim-slider"
        />
      </section>

      <style>{`
        .setting-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 3px; font-weight: 700; }
        .slim-slider {
          width: 100%; -webkit-appearance: none; background: var(--accent-soft); height: 2px; border-radius: 2px; margin-top: 30px; outline: none;
        }
        .slim-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px; background: var(--accent-gold); border-radius: 50%; cursor: pointer; transition: transform 0.2s;
        }
        .slim-slider::-webkit-slider-thumb:hover { transform: scale(1.3); }
      `}</style>
    </div>
  );
};

export default SettingsPanel;
