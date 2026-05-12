import React, { useState, useRef, useEffect } from 'react';

const TitleBar = ({ onMenuAction }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menus = [
    {
      label: 'Navigate',
      items: [
        { label: 'Reader', action: 'open-reader', shortcut: 'Ctrl+1' },
        { label: 'Home / Dashboard', action: 'open-dashboard', shortcut: 'Ctrl+2' },
        { type: 'separator' },
        { label: 'Library', action: 'open-library', shortcut: 'Ctrl+L' },
        { label: 'Reading Plans', action: 'open-plans', shortcut: 'Ctrl+R' },
        { label: 'Prayer Journal', action: 'open-prayer', shortcut: 'Ctrl+P' },
        { label: 'Search', action: 'open-search', shortcut: 'Ctrl+F' },
        { type: 'separator' },
        { label: 'Settings', action: 'open-settings', shortcut: 'Ctrl+,' }
      ]
    },
    {
      label: 'Scripture',
      items: [
        { label: 'Previous Chapter', action: 'prev-chapter', shortcut: 'Ctrl+Left' },
        { label: 'Next Chapter', action: 'next-chapter', shortcut: 'Ctrl+Right' },
        { type: 'separator' },
        { label: 'Toggle Split View', action: 'toggle-split', shortcut: 'Ctrl+\\' },
        { label: 'Read Aloud', action: 'toggle-tts', shortcut: 'Ctrl+Space' },
        { type: 'separator' },
        { label: 'Open Passage Picker', action: 'open-picker', shortcut: 'Ctrl+G' }
      ]
    }
  ];

  const handleMenuClick = (action) => {
    setActiveMenu(null);
    if (onMenuAction) {
      onMenuAction(action);
    }
  };

  const handleWindowControl = (control) => {
    if (window.electronAPI && window.electronAPI[control]) {
      window.electronAPI[control]();
    }
  };

  return (
    <div className="custom-titlebar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '32px',
      background: 'var(--bg-elevated)', // Adapts to theme
      color: 'var(--text-primary)',
      borderBottom: '1px solid var(--accent-soft)',
      userSelect: 'none',
      flexShrink: 0,
      zIndex: 9999,
      position: 'relative'
    }}>
      {/* App Icon & Title */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>BIBLICA</span>
      </div>

      {/* Menus */}
      <div ref={menuRef} style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center' }}>
        {menus.map((menu, i) => (
          <div key={i} style={{ position: 'relative', height: '100%' }}>
            <button
              onClick={() => setActiveMenu(activeMenu === i ? null : i)}
              onMouseEnter={() => { if (activeMenu !== null) setActiveMenu(i); }}
              className="no-drag"
              style={{
                height: '100%',
                padding: '0 12px',
                background: activeMenu === i ? 'var(--bg-surface)' : 'transparent',
                border: 'none',
                color: activeMenu === i ? 'var(--accent-gold)' : 'var(--text-primary)',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              {menu.label}
            </button>
            
            {activeMenu === i && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                minWidth: '220px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--accent-soft)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                borderRadius: '0 0 6px 6px',
                padding: '4px 0',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10000
              }}>
                {menu.items.map((item, j) => item.type === 'separator' ? (
                  <div key={j} style={{ height: '1px', background: 'var(--accent-soft)', margin: '4px 0' }} />
                ) : (
                  <button
                    key={j}
                    onClick={() => handleMenuClick(item.action)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                      e.currentTarget.style.color = 'var(--accent-gold)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span style={{ opacity: 0.5, fontSize: '11px' }}>{item.shortcut}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Window Controls */}
      <div className="no-drag" style={{ display: 'flex', height: '100%' }}>
        <button
          onClick={() => handleWindowControl('minimize')}
          className="window-control-btn"
          style={controlBtnStyle}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 5H9" stroke="currentColor" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          onClick={() => handleWindowControl('maximize')}
          className="window-control-btn"
          style={controlBtnStyle}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="1.5" width="7" height="7" stroke="currentColor"/>
          </svg>
        </button>
        <button
          onClick={() => handleWindowControl('close')}
          className="window-control-btn close"
          style={controlBtnStyle}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <style>{`
        .custom-titlebar { -webkit-app-region: drag; }
        .no-drag { -webkit-app-region: no-drag; }
        .window-control-btn:hover { background: rgba(128,128,128,0.2) !important; }
        .window-control-btn.close:hover { background: #e81123 !important; color: white !important; }
      `}</style>
    </div>
  );
};

const controlBtnStyle = {
  background: 'transparent',
  border: 'none',
  width: '46px',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  transition: 'background 0.1s, color 0.1s',
  outline: 'none'
};

export default TitleBar;
