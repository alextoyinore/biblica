import React, { useState, useEffect, useRef } from 'react';
import PassagePickerInline from './components/PassagePickerInline.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import LibraryPanel from './components/LibraryPanel.jsx';
import StudyPanel from './components/StudyPanel.jsx';
import { fetchPassage } from './services/bibleService';
import * as DB from './services/db';
import bibleData from './data/bible-meta.json';

const TRANSLATIONS = [
  { id: 'kjv', name: 'King James Version' },
  { id: 'asv', name: 'American Standard Version' },
  { id: 'web', name: 'World English Bible' },
  { id: 'bbe', name: 'Bible in Basic English' }
];

const HIGHLIGHT_COLORS = [
  { id: 'gold', color: '#c5a059' },
  { id: 'amber', color: '#f39c12' },
  { id: 'emerald', color: '#2ecc71' },
  { id: 'mint', color: '#1abc9c' },
  { id: 'sky', color: '#3498db' },
  { id: 'lavender', color: '#9b59b6' },
  { id: 'ruby', color: '#e74c3c' },
  { id: 'slate', color: '#95a5a6' }
];

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const App = () => {
  // Navigation States
  const [activePanel, setActivePanel] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isStudyOpen, setIsStudyOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(false);
  const [activeVerseForNote, setActiveVerseForNote] = useState(null);
  const [activeVerseMenu, setActiveVerseMenu] = useState(null);
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scripture, setScripture] = useState(null);
  const [translation, setTranslation] = useState('kjv');
  const [passage, setPassage] = useState({
    book: 'Genesis',
    chapter: 1,
    verse: null
  });

  // User States (Persistence)
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState({});
  const [highlights, setHighlights] = useState({});
  const [settings, setSettings] = useState({
    fontSize: 1.3,
    lineHeight: 2.2,
    theme: 'modern-sacred',
    highlightStyle: 'heavy'
  });

  const verseRefs = useRef({});
  const mainRef = useRef(null);
  const dragStart = useRef(null);

  // Global click-away listener for the verse menu
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeVerseMenu) setActiveVerseMenu(null);
    };
    if (activeVerseMenu) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeVerseMenu]);

  // Initial Load
  useEffect(() => {
    const initStorage = async () => {
      const savedSettings = localStorage.getItem('biblica_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
      setNotes(await DB.getNotes());
      setHistory(await DB.getHistory());
      setBookmarks(await DB.getBookmarks());
      setHighlights(await DB.getHighlights());
    };
    initStorage();
  }, []);

  useEffect(() => localStorage.setItem('biblica_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => { document.body.setAttribute('data-theme', settings.theme); }, [settings.theme]);

  // Main Fetch Effect
  useEffect(() => {
    const loadScripture = async () => {
      setLoading(true);
      setError(null);
      const cacheId = `${translation}_${passage.book}_${passage.chapter}`;
      const cached = await DB.getScripture(cacheId);

      if (cached) {
        setScripture(cached);
        setLoading(false);
        if (mainRef.current) mainRef.current.scrollTop = 0;
        const snippet = cached.verses[0]?.text.substring(0, 80) + '...';
        await DB.saveHistory({ book: passage.book, chapter: passage.chapter, translation, text: snippet });
        setHistory(await DB.getHistory());
        return;
      }

      try {
        const data = await fetchPassage(passage.book, passage.chapter, null, translation);
        setScripture(data);
        await DB.saveScripture(cacheId, data);
        if (mainRef.current) mainRef.current.scrollTop = 0;
        const snippet = data.verses[0]?.text.substring(0, 80) + '...';
        await DB.saveHistory({ book: passage.book, chapter: passage.chapter, translation, text: snippet });
        setHistory(await DB.getHistory());
      } catch (err) {
        setError('Failed to load the Word.');
      } finally {
        setLoading(false);
      }
    };
    loadScripture();
  }, [passage.book, passage.chapter, translation]);

  const navigateChapter = (direction) => {
    const bookIndex = bibleData.books.findIndex(b => b.book === passage.book);
    const currentBook = bibleData.books[bookIndex];
    if (direction === 'next') {
      if (passage.chapter < currentBook.chapters) setPassage({ ...passage, chapter: passage.chapter + 1, verse: null });
      else if (bookIndex < bibleData.books.length - 1) setPassage({ book: bibleData.books[bookIndex + 1].book, chapter: 1, verse: null });
    } else {
      if (passage.chapter > 1) setPassage({ ...passage, chapter: passage.chapter - 1, verse: null });
      else if (bookIndex > 0) setPassage({ book: bibleData.books[bookIndex - 1].book, chapter: bibleData.books[bookIndex - 1].chapters, verse: null });
    }
  };

  // Keyboard and Drag Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activePanel || isSidebarOpen || isSettingsOpen) return;
      if (e.key === 'ArrowRight') navigateChapter('next');
      if (e.key === 'ArrowLeft') navigateChapter('prev');
      if (e.key === 'Escape') setActiveVerseMenu(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [passage, activePanel, isSidebarOpen, isSettingsOpen]);

  // Mouse Drag Logic
  const handleMouseDown = (e) => { if (!activePanel && !isSidebarOpen) dragStart.current = e.clientX; };
  const handleMouseUp = (e) => {
    if (dragStart.current !== null) {
      const diff = e.clientX - dragStart.current;
      if (Math.abs(diff) > 100) navigateChapter(diff > 0 ? 'prev' : 'next');
      dragStart.current = null;
    }
  };

  const handleVerseTextClick = (e, v) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveVerseMenu({ verse: v, x: rect.left, y: rect.top - 185 });
  };

  const applyHighlight = async (color) => {
    const id = `${passage.book}_${passage.chapter}_${activeVerseMenu.verse.verse}`;
    setHighlights(prev => {
      if (!color) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: color };
    });
    await DB.saveHighlight(id, color);
    setActiveVerseMenu(null);
  };

  const handleToggleBookmark = async () => {
    const v = activeVerseMenu.verse;
    const item = { book: passage.book, chapter: passage.chapter, verse: v.verse, translation, text: v.text };
    await DB.toggleBookmark(item);
    setBookmarks(await DB.getBookmarks());
    setActiveVerseMenu(null);
  };

  const updateNote = async (verseNumber, text) => {
    const noteKey = `${passage.book}_${passage.chapter}_${verseNumber}`;
    setNotes(prev => ({ ...prev, [noteKey]: text }));
    await DB.saveNote(noteKey, text);
  };

  return (
    <div className="app-container">
      <aside className={`sidebar-left ${isSidebarOpen ? 'open' : 'closed'}`} style={{ width: isSidebarOpen ? '300px' : '0', overflow: 'hidden', transition: 'width 0.3s ease' }}>
        <div style={{ minWidth: '300px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--accent-soft)', textAlign: 'center' }}>
            <h1 style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '4px', fontWeight: '800' }}>BIBLICA</h1>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <PassagePickerInline currentPassage={passage} onSelect={(p) => { setPassage(p); setIsSidebarOpen(false); setIsSettingsOpen(false); }} />
          </div>
        </div>
      </aside>

      <main className="main-content" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onClick={() => setIsNavVisible(!isNavVisible)}>
        {!isSettingsOpen && (
          <header style={{ padding: '15px 40px', borderBottom: '1px solid var(--accent-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', zIndex: 10, transition: 'background-color 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <button onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(!isSidebarOpen); }} style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
                {passage.book} {passage.chapter}{passage.verse ? `:${passage.verse}` : ''}
              </button>
              <select onClick={(e) => e.stopPropagation()} value={translation} onChange={(e) => setTranslation(e.target.value)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', outline: 'none', cursor: 'pointer' }}>
                {TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.id.toUpperCase()}</option>)}
              </select>
            </div>
            <nav style={{ display: 'flex', gap: '20px' }}>
              <button onClick={(e) => { e.stopPropagation(); setActivePanel('library'); }} className="nav-link">Library</button>
              <button onClick={(e) => { e.stopPropagation(); setActivePanel('search'); }} className="nav-link">Search</button>
              <button onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }} className="nav-link">Settings</button>
            </nav>
          </header>
        )}

        <div ref={mainRef} style={{ flex: 1, overflowY: 'auto', scrollBehavior: 'smooth' }}>
          {isSettingsOpen ? (
            <SettingsPanel settings={settings} onUpdateSettings={setSettings} onClose={() => setIsSettingsOpen(false)} />
          ) : (
            <div style={{ padding: '60px 80px', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
              {loading && !scripture && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '100px', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.7rem' }}>Synchronizing...</div>
              )}
              {scripture && (
                <article className="scripture-text" style={{ fontSize: `${settings.fontSize}rem`, lineHeight: settings.lineHeight, color: loading ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  {scripture.verses.map((v, i) => {
                    const id = `${passage.book}_${passage.chapter}_${v.verse}`;
                    const isHighlighted = passage.verse === v.verse;
                    const highlightColor = highlights[id];
                    const isBookmarked = bookmarks.some(b => b.book === passage.book && b.chapter === passage.chapter && b.verse === v.verse);
                    const hasNote = !!notes[id];
                    const isHeavy = (settings.highlightStyle || 'heavy') === 'heavy';
                    const bgColor = highlightColor ? (isHeavy ? highlightColor : hexToRgba(highlightColor, 0.2)) : (isHighlighted ? 'rgba(197, 160, 89, 0.15)' : 'transparent');
                    const textColor = (highlightColor && isHeavy) ? '#ffffff' : 'inherit';
                    return (
                      <span key={i} ref={el => verseRefs.current[v.verse] = el} onClick={(e) => handleVerseTextClick(e, v)} style={{ position: 'relative', backgroundColor: bgColor, color: textColor, borderRadius: '4px', padding: '2px 4px', margin: '0 -4px', display: 'inline', borderBottom: hasNote ? '2px dotted var(--accent-gold)' : 'none', cursor: 'pointer', transition: 'background-color 0.3s ease' }}>
                        <sup onClick={(e) => { e.stopPropagation(); setActiveVerseForNote(v); setIsStudyOpen(true); }} style={{ fontSize: '0.6em', color: isBookmarked ? 'var(--accent-gold)' : (highlightColor && isHeavy ? '#ffffff' : 'var(--accent-gold)'), marginRight: '12px', marginLeft: i === 0 ? 0 : '10px', verticalAlign: 'baseline', cursor: 'pointer', fontWeight: '800' }}>
                          {v.verse}{isBookmarked ? ' 🔖' : ''}
                        </sup>
                        {v.text}
                        {' '}
                      </span>
                    );
                  })}
                </article>
              )}
              {activeVerseMenu && (
                <div className="verse-menu" style={{ position: 'fixed', left: `${activeVerseMenu.x - 40}px`, top: `${activeVerseMenu.y}px`, zIndex: 9999 }} onClick={(e) => e.stopPropagation()}>
                  <div className="menu-header">
                    <button className={`menu-action bookmark ${bookmarks.some(b => b.book === passage.book && b.chapter === passage.chapter && b.verse === activeVerseMenu.verse.verse) ? 'active' : ''}`} onClick={handleToggleBookmark}>
                      <span className="icon">🔖</span> {bookmarks.some(b => b.book === passage.book && b.chapter === passage.chapter && b.verse === activeVerseMenu.verse.verse) ? 'Remove Bookmark' : 'Bookmark Verse'}
                    </button>
                  </div>
                  <div className="color-grid">{HIGHLIGHT_COLORS.map(c => (<button key={c.id} className="color-dot" style={{ backgroundColor: c.color }} onClick={() => applyHighlight(c.color)} />))}<button className="color-dot clear" onClick={() => applyHighlight(null)}>×</button></div>
                  <div className="menu-footer"><button className="menu-action" onClick={() => { setActiveVerseForNote(activeVerseMenu.verse); setIsStudyOpen(true); setActiveVerseMenu(null); }}><span className="icon">✎</span> Add Study Note</button></div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Side Navigation */}
      {!isSettingsOpen && (
        <>
          <button 
            className={`side-nav-btn prev ${isNavVisible ? 'visible' : ''}`} 
            style={{ left: isSidebarOpen ? '320px' : '20px' }}
            onClick={(e) => { e.stopPropagation(); navigateChapter('prev'); }}
          >
            <span>←</span>
          </button>
          <button 
            className={`side-nav-btn next ${isNavVisible ? 'visible' : ''}`} 
            style={{ right: '20px' }}
            onClick={(e) => { e.stopPropagation(); navigateChapter('next'); }}
          >
            <span>→</span>
          </button>
        </>
      )}

      {isStudyOpen && !isSettingsOpen && (<aside className="sidebar-right"><StudyPanel activeVerse={activeVerseForNote} note={notes[`${passage.book}_${passage.chapter}_${activeVerseForNote?.verse}`]} onUpdateNote={updateNote} onClose={() => setIsStudyOpen(false)} /></aside>)}
      <SearchPanel isOpen={activePanel === 'search'} onClose={() => setActivePanel(null)} translation={translation} onSelectResult={(res) => { setPassage({ book: res.book_name, chapter: res.chapter, verse: res.verse }); setActivePanel(null); setIsSettingsOpen(false); }} />
      <LibraryPanel isOpen={activePanel === 'library'} onClose={() => setActivePanel(null)} history={history} bookmarks={bookmarks} onSelectPassage={(p) => { setPassage(p); setTranslation(p.translation || translation); setActivePanel(null); setIsSettingsOpen(false); }} />

      <style>{`
        .nav-link { background: none !important; border: none !important; box-shadow: none !important; color: var(--text-muted); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; cursor: pointer; transition: var(--transition-smooth); padding: 5px 0; outline: none; }
        .nav-link:hover { color: var(--accent-gold); background: none !important; }
        .nav-link.gold { color: var(--accent-gold); }
        .sidebar-left.closed { width: 0; }
        .sidebar-left.open { width: 300px; border-right: 1px solid var(--accent-soft); }
        
        .side-nav-btn {
          position: fixed; top: 50%; transform: translateY(-50%);
          width: 50px; height: 80px;
          background: rgba(var(--bg-surface-rgb), 0.3);
          backdrop-filter: blur(20px);
          border: 1px solid var(--accent-soft);
          color: var(--accent-gold);
          font-size: 1.2rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; opacity: 0; pointer-events: none;
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          z-index: 500;
        }
        .side-nav-btn.prev { border-radius: 40px 15px 15px 40px; }
        .side-nav-btn.next { border-radius: 15px 40px 40px 15px; }
        .side-nav-btn.visible { opacity: 0.3; pointer-events: auto; }
        .side-nav-btn:hover { background: rgba(var(--accent-gold-rgb), 0.15); border-color: var(--accent-gold); transform: translateY(-50%) scale(1.05); opacity: 1 !important; }

        .verse-menu { background: var(--bg-surface); border: 1px solid var(--accent-soft); border-radius: 18px; padding: 8px; display: flex; flex-direction: column; gap: 4px; min-width: 200px; backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); background-color: rgba(var(--bg-surface-rgb), 0.9); animation: airIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: none !important; }
        [data-theme='modern-sacred'] .verse-menu { background-color: rgba(18, 18, 20, 0.9); }
        [data-theme='sepia'] .verse-menu { background-color: rgba(253, 246, 227, 0.9); }
        [data-theme='light'] .verse-menu { background-color: rgba(255, 255, 255, 0.9); }
        .menu-header { border-bottom: 1px solid var(--accent-soft); padding-bottom: 4px; margin-bottom: 4px; }
        .menu-footer { border-top: 1px solid var(--accent-soft); padding-top: 4px; margin-top: 4px; }
        .menu-action { width: 100%; background: none; border: none; color: var(--text-primary); font-size: 0.8rem; text-align: left; padding: 10px 12px; border-radius: 10px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 10px; transition: var(--transition-smooth); }
        .menu-action:hover { background: rgba(var(--accent-gold-rgb), 0.1); color: var(--accent-gold); }
        .menu-action.bookmark.active { color: var(--accent-gold); }
        .menu-action .icon { font-size: 1rem; opacity: 0.8; }
        .color-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; padding: 8px; }
        .color-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.2s; }
        .color-dot:hover { transform: scale(1.15); border-color: var(--text-primary); }
        .color-dot.clear { background: var(--bg-deep) !important; color: var(--text-muted); font-size: 1.2rem; line-height: 24px; display: flex; align-items: center; justify-content: center; }
        @keyframes airIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;
