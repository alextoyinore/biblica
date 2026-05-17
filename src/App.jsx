import React, { useState, useEffect, useRef } from 'react';
import PassagePickerInline from './components/PassagePickerInline.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import LibraryPanel from './components/LibraryPanel.jsx';
import StudyPanel from './components/StudyPanel.jsx';
import Dashboard from './components/Dashboard.jsx';
import ArtShareModal from './components/ArtShareModal.jsx';
import ReadingPlanPanel from './components/ReadingPlanPanel.jsx';
import PrayerPanel from './components/PrayerPanel.jsx';
import TitleBar from './components/TitleBar.jsx';
import AboutModal from './components/AboutModal.jsx';
import HelpPanel from './components/HelpPanel.jsx';

import AudioController from './components/AudioController.jsx';
import CommentaryPanel from './components/CommentaryPanel.jsx';
import { fetchPassage, fetchCommentary } from './services/bibleService';
import * as DB from './services/db';
import { saveNoteEntry, deleteNoteEntry } from './services/db';
import bibleData from './data/bible-meta.json';

const TRANSLATIONS = [
  { id: 'kjv', name: 'King James Version' },
  { id: 'bbe', name: 'Bible in Basic English' },
  { id: 'yor', name: 'Yoruba Bible' },
  { id: 'asv', name: 'American Standard Version' },
  { id: 'web', name: 'World English Bible' },
  { id: 'dby', name: 'Darby Translation' },
  { id: 'dra', name: 'Douay-Rheims 1899' },
  { id: 'ylt', name: "Young's Literal Translation" },
  { id: 'bsb', name: 'Berean Standard Bible' }
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeVerseForNote, setActiveVerseForNote] = useState(null);
  const [activeVerseMenu, setActiveVerseMenu] = useState(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isArtShareOpen, setIsArtShareOpen] = useState(false);
  const [activeVerseForArt, setActiveVerseForArt] = useState(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
  // Commentary State
  const [isCommentaryOpen, setIsCommentaryOpen] = useState(false);
  const [activeVerseForCommentary, setActiveVerseForCommentary] = useState(null);
  
  // Parallel States
  const [isParallel, setIsParallel] = useState(false);
  const [secondaryTranslation, setSecondaryTranslation] = useState('asv');
  const [secondaryScripture, setSecondaryScripture] = useState(null);
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scripture, setScripture] = useState(null);
  const [translation, setTranslation] = useState(() => localStorage.getItem('biblica_last_translation') || 'kjv');
  const [passage, setPassage] = useState(() => {
    const saved = localStorage.getItem('biblica_last_passage');
    return saved ? JSON.parse(saved) : { book: 'Genesis', chapter: 1, verse: null };
  });
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // User States (Persistence)
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState({});
  const [highlights, setHighlights] = useState({});
  const [settings, setSettings] = useState({
    fontSize: 1.3,
    lineHeight: 2.2,
    commentaryFontSize: 1.0,
    theme: 'modern-sacred',
    highlightStyle: 'heavy',
    ambientVolume: 0.4,
    audioVolume: 1.0
  });

  const verseRefs = useRef({});
  const mainRef = useRef(null);
  const dragStart = useRef(null);
  const audioRef = useRef(null);

  // Global click-away listener for verse menu and nav dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeVerseMenu) setActiveVerseMenu(null);
      if (isMenuOpen) setIsMenuOpen(false);
    };
    if (activeVerseMenu || isMenuOpen) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeVerseMenu, isMenuOpen]);

  // Handle Auto-Play next chapter
  useEffect(() => {
    if (!loading && scripture && autoPlayNext) {
      if (audioRef.current) {
        setTimeout(() => {
          audioRef.current.play();
        }, 500);
      }
      setAutoPlayNext(false);
    }
  }, [loading, scripture, autoPlayNext]);

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
  useEffect(() => localStorage.setItem('biblica_last_passage', JSON.stringify(passage)), [passage]);
  useEffect(() => localStorage.setItem('biblica_last_translation', translation), [translation]);
  useEffect(() => { document.body.setAttribute('data-theme', settings.theme); }, [settings.theme]);

  // Menu Action Handler
  const handleMenuAction = (action) => {
    switch (action) {
      case 'open-reader':
        setIsDashboardOpen(false);
        setActivePanel(null);
        setIsSettingsOpen(false);
        break;
      case 'open-dashboard':
        setIsDashboardOpen(true);
        break;
      case 'open-library':
        setActivePanel('library');
        setIsDashboardOpen(false);
        setIsSettingsOpen(false);
        break;
      case 'open-plans':
        setActivePanel('plans');
        setIsDashboardOpen(false);
        setIsSettingsOpen(false);
        break;
      case 'open-prayer':
        setActivePanel('prayer');
        setIsDashboardOpen(false);
        setIsSettingsOpen(false);
        break;
      case 'open-search':
        setActivePanel('search');
        setIsDashboardOpen(false);
        setIsSettingsOpen(false);
        break;
      case 'open-help':
        setActivePanel('help');
        setIsDashboardOpen(false);
        setIsSettingsOpen(false);
        break;
      case 'open-about':
        setIsAboutOpen(true);
        break;
      case 'open-settings':
        setIsSettingsOpen(true);
        setIsDashboardOpen(false);
        break;
      case 'prev-chapter':
        navigateChapter('prev');
        break;
      case 'next-chapter':
        navigateChapter('next');
        break;
      case 'toggle-split':
        setIsParallel(prev => !prev);
        break;
      case 'open-picker':
        setIsSidebarOpen(true);
        break;
      case 'toggle-tts':
        if (audioRef.current) audioRef.current.togglePlay();
        break;
      default:
        break;
    }
  };

  // IPC Menu Action Listener
  useEffect(() => {
    if (!window.electronAPI) return;
    return window.electronAPI.onMenuAction(handleMenuAction);
  }, [passage]); // Include passage/navigateChapter deps if they change, though navigateChapter uses state directly.

  // Main Fetch Effect (Handles Parallel)
  useEffect(() => {
    const loadScriptures = async () => {
      setLoading(true);
      setError(null);
      
      const loadOne = async (t) => {
        const cacheId = `${t}_${passage.book}_${passage.chapter}`;
        const cached = await DB.getScripture(cacheId);
        if (cached) return cached;
        const data = await fetchPassage(passage.book, passage.chapter, null, t, settings.audioApiKey);
        await DB.saveScripture(cacheId, data);
        return data;
      };

      try {
        const primary = await loadOne(translation);
        setScripture(primary);
        
        if (isParallel) {
          const secondary = await loadOne(secondaryTranslation);
          setSecondaryScripture(secondary);
        } else {
          setSecondaryScripture(null);
        }

        if (mainRef.current) mainRef.current.scrollTop = 0;
        const snippet = primary.verses[0]?.text.substring(0, 80) + '...';
        await DB.saveHistory({ book: passage.book, chapter: passage.chapter, translation, text: snippet });
        setHistory(await DB.getHistory());
      } catch (err) {
        setError('Failed to load the Word.');
      } finally {
        setLoading(false);
      }
    };
    loadScriptures();
  }, [passage.book, passage.chapter, translation, secondaryTranslation, isParallel]);

  const handleDashboardNavigate = (target) => {
    if (typeof target === 'object') {
      if (isAudioPlaying) setAutoPlayNext(true);
      setPassage(target);
    } else if (target === 'library') {
      setActivePanel('library');
    } else if (target === 'search') {
      setActivePanel('search');
    } else if (target === 'bookmarks') {
      setActivePanel('library');
    } else if (target === 'plans') {
      setActivePanel('plans');
    } else if (target === 'prayer') {
      setActivePanel('prayer');
    }
    setIsDashboardOpen(false);
  };

  const navigateChapter = (direction) => {
    if (isAudioPlaying) setAutoPlayNext(true);
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle Escape for all modals/menus
      if (e.key === 'Escape') {
        if (activeVerseMenu) setActiveVerseMenu(null);
        if (isAboutOpen) setIsAboutOpen(false);
        if (isArtShareOpen) setIsArtShareOpen(false);
        if (isSidebarOpen) setIsSidebarOpen(false);
        if (isMenuOpen) setIsMenuOpen(false);
        if (activePanel === 'search' || activePanel === 'help') setActivePanel(null);
        return;
      }
      
      // Handle F1 for Help
      if (e.key === 'F1') {
        e.preventDefault();
        handleMenuAction('open-help');
        return;
      }

      // Handle Ctrl/Cmd modifiers
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl) {
        switch (e.key.toLowerCase()) {
          case '1': e.preventDefault(); handleMenuAction('open-reader'); break;
          case '2': e.preventDefault(); handleMenuAction('open-dashboard'); break;
          case 'l': e.preventDefault(); handleMenuAction('open-library'); break;
          case 'r': e.preventDefault(); handleMenuAction('open-plans'); break;
          case 'p': e.preventDefault(); handleMenuAction('open-prayer'); break;
          case 'f': e.preventDefault(); handleMenuAction('open-search'); break;
          case ',': e.preventDefault(); handleMenuAction('open-settings'); break;
          case '\\': e.preventDefault(); handleMenuAction('toggle-split'); break;
          case ' ': e.preventDefault(); handleMenuAction('toggle-tts'); break;
          case 'g': e.preventDefault(); handleMenuAction('open-picker'); break;
          case 'arrowright': e.preventDefault(); handleMenuAction('next-chapter'); break;
          case 'arrowleft': e.preventDefault(); handleMenuAction('prev-chapter'); break;
          default: break;
        }
        return;
      }

      // Regular keys without modifiers
      if (activePanel || isSidebarOpen || isSettingsOpen) return;

      // Don't intercept arrow keys when focus is inside a text field or rich-text editor
      const tag = document.activeElement?.tagName;
      const isEditable = document.activeElement?.isContentEditable;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || isEditable) return;

      if (e.key === 'ArrowRight') navigateChapter('next');
      if (e.key === 'ArrowLeft') navigateChapter('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [passage, activePanel, isSidebarOpen, isSettingsOpen, activeVerseMenu, isAboutOpen, isArtShareOpen, isMenuOpen]);

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
    if (isAudioPlaying && audioRef.current) {
      audioRef.current.playFromVerse(parseInt(v.verse));
      return;
    }
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

  const addOrUpdateNoteEntry = async (verseKey, noteId, content, title = '') => {
    await saveNoteEntry(verseKey, noteId, content, title);
    setNotes(await DB.getNotes());
  };

  const removeNoteEntry = async (verseKey, noteId) => {
    await deleteNoteEntry(verseKey, noteId);
    setNotes(await DB.getNotes());
  };

  const renderVerseText = (text) => {
    if (!text) return null;
    const parts = text.split(/\{([^}]+)\}/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <span key={index} style={{ fontStyle: 'italic', opacity: 0.85 }}>{part}</span>;
      }
      return part;
    });
  };

  const renderScripture = (data, t, isMain) => {
    if (!data) return null;
    return (
      <article className="scripture-text" style={{ fontSize: `${settings.fontSize}rem`, lineHeight: settings.lineHeight, color: loading ? 'var(--text-muted)' : 'var(--text-primary)', flex: 1 }}>
        {data.verses.map((v, i) => {
          const id = `${passage.book}_${passage.chapter}_${v.verse}`;
          const isHighlighted = passage.verse === v.verse;
          const highlightColor = highlights[id];
          const isBookmarked = bookmarks.some(b => b.book === passage.book && b.chapter === passage.chapter && b.verse === v.verse);
          const hasNote = Array.isArray(notes[id]) && notes[id].length > 0;
          const isHeavy = (settings.highlightStyle || 'heavy') === 'heavy';
          const bgColor = highlightColor ? (isHeavy ? highlightColor : hexToRgba(highlightColor, 0.2)) : (isHighlighted ? 'rgba(197, 160, 89, 0.15)' : 'transparent');
          const textColor = (highlightColor && isHeavy) ? '#ffffff' : 'inherit';
          return (
            <span key={i} ref={el => isMain && (verseRefs.current[v.verse] = el)} onClick={(e) => handleVerseTextClick(e, v)} style={{ position: 'relative', backgroundColor: bgColor, color: textColor, borderRadius: '4px', padding: '2px 4px', margin: '0 -4px', display: 'inline', borderBottom: hasNote ? '2px dotted var(--accent-gold)' : 'none', cursor: 'pointer', transition: 'background-color 0.3s ease' }}>
              <sup onClick={(e) => { e.stopPropagation(); setActiveVerseForNote(v); setIsStudyOpen(true); }} style={{ fontSize: '0.6em', color: isBookmarked ? 'var(--accent-gold)' : (highlightColor && isHeavy ? '#ffffff' : 'var(--accent-gold)'), marginRight: '12px', marginLeft: i === 0 ? 0 : '10px', verticalAlign: 'baseline', cursor: 'pointer', fontWeight: '800' }}>
                {v.verse}{isBookmarked ? ' 🔖' : ''}
              </sup>
              {renderVerseText(v.text)}
              {' '}
            </span>
          );
        })}
      </article>
    );
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar onMenuAction={handleMenuAction} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside className={`sidebar-left ${isSidebarOpen ? 'open' : 'closed'}`} style={{ width: isSidebarOpen ? '300px' : '0', overflow: 'hidden', transition: 'width 0.3s ease' }}>
        <div style={{ minWidth: '300px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--accent-soft)', textAlign: 'center' }}>
            <h1 style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '4px', fontWeight: '800' }}>BIBLICA</h1>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <PassagePickerInline currentPassage={passage} onSelect={(p) => { if (isAudioPlaying) setAutoPlayNext(true); setPassage(p); setIsSidebarOpen(false); setIsSettingsOpen(false); }} />
          </div>
        </div>
      </aside>

      <main className="main-content" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onClick={() => setIsNavVisible(!isNavVisible)}>
        <header style={{ padding: '12px 32px', borderBottom: '1px solid var(--accent-soft)', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', background: 'var(--bg-surface)', zIndex: 3000, position: 'relative', transition: 'background-color 0.4s ease', flexShrink: 0 }}>
            {/* LEFT: Passage + Translation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(!isSidebarOpen); }} style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
                {passage.book} {passage.chapter}{passage.verse ? `:${passage.verse}` : ''}
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select onClick={(e) => e.stopPropagation()} value={translation} onChange={(e) => setTranslation(e.target.value)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', outline: 'none', cursor: 'pointer' }}>
                  {TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.id.toUpperCase()}</option>)}
                </select>
                {isParallel && (
                  <>
                    <span style={{ color: 'var(--accent-soft)', fontSize: '0.8rem' }}>|</span>
                    <select onClick={(e) => e.stopPropagation()} value={secondaryTranslation} onChange={(e) => setSecondaryTranslation(e.target.value)} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', outline: 'none', cursor: 'pointer' }}>
                      {TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.id.toUpperCase()}</option>)}
                    </select>
                  </>
                )}
              </div>
            </div>

            {/* CENTER: Audio Player */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AudioController 
                ref={audioRef} 
                scripture={scripture} 
                ambientVolume={settings.ambientVolume ?? 0.4} 
                audioVolume={settings.audioVolume ?? 1.0}
                apiKey={settings.audioApiKey} 
                onPlayStateChange={setIsAudioPlaying}
                onAudioEnd={() => {
                  setAutoPlayNext(true);
                  navigateChapter('next');
                }}
                onActiveVerseChange={(verseNum) => {
                  if (verseRefs.current[verseNum]) {
                    verseRefs.current[verseNum].scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              />
            </div>

            {/* RIGHT: Menu Trigger */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
              <button
                className="menu-trigger"
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(o => !o); }}
                title="Menu"
              >
                <span></span><span></span><span></span>
              </button>
              {isMenuOpen && (
                <div className="air-dropdown" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setIsDashboardOpen(true); setIsMenuOpen(false); }} className={`air-item ${isDashboardOpen ? 'active' : ''}`}><span className="air-icon">⌂</span>Home</button>
                  <button onClick={() => { setIsParallel(!isParallel); setIsMenuOpen(false); }} className={`air-item ${isParallel ? 'active' : ''}`}><span className="air-icon">⧉</span>Split View</button>
                  <div className="air-divider" />
                  <button onClick={() => { setActivePanel('library'); setIsDashboardOpen(false); setIsMenuOpen(false); }} className="air-item"><span className="air-icon">📚</span>Library</button>
                  <button onClick={() => { setActivePanel('plans'); setIsDashboardOpen(false); setIsMenuOpen(false); }} className="air-item"><span className="air-icon">📅</span>Reading Plans</button>
                  <button onClick={() => { setActivePanel('prayer'); setIsDashboardOpen(false); setIsMenuOpen(false); }} className="air-item"><span className="air-icon">🙏</span>Prayer Journal</button>
                  <button onClick={() => { setActivePanel('search'); setIsDashboardOpen(false); setIsMenuOpen(false); }} className="air-item"><span className="air-icon">🔍</span>Search</button>
                  <div className="air-divider" />
                  <button onClick={() => { setIsSettingsOpen(true); setIsDashboardOpen(false); setIsMenuOpen(false); }} className="air-item"><span className="air-icon">⚙</span>Settings</button>
                </div>
              )}
            </div>
        </header>

        <div ref={mainRef} style={{ flex: 1, overflowY: 'auto', scrollBehavior: 'smooth' }}>
          {isDashboardOpen ? (
            <Dashboard onNavigate={handleDashboardNavigate} lastPassage={passage} />
          ) : isSettingsOpen ? (
            <SettingsPanel settings={settings} onUpdateSettings={setSettings} onClose={() => setIsSettingsOpen(false)} />
          ) : activePanel === 'help' ? (
            <HelpPanel onClose={() => setActivePanel(null)} />
          ) : (
            <div style={{ padding: '60px 80px', maxWidth: isParallel ? '1400px' : '800px', margin: '0 auto', position: 'relative', display: 'flex', gap: '60px' }}>
              {loading && !scripture && (
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.7rem' }}>Synchronizing...</div>
              )}
              {renderScripture(scripture, translation, true)}
              {isParallel && renderScripture(secondaryScripture, secondaryTranslation, false)}

              {activeVerseMenu && (
                <div className="verse-menu" style={{ position: 'fixed', left: `${activeVerseMenu.x - 40}px`, top: `${activeVerseMenu.y}px`, zIndex: 9999 }} onClick={(e) => e.stopPropagation()}>
                  <div className="menu-header">
                    <button className={`menu-action bookmark ${bookmarks.some(b => b.book === passage.book && b.chapter === passage.chapter && b.verse === activeVerseMenu.verse.verse) ? 'active' : ''}`} onClick={handleToggleBookmark}>
                      <span className="icon">🔖</span> {bookmarks.some(b => b.book === passage.book && b.chapter === passage.chapter && b.verse === activeVerseMenu.verse.verse) ? 'Remove Bookmark' : 'Bookmark Verse'}
                    </button>
                  </div>
                  <div className="color-grid">{HIGHLIGHT_COLORS.map(c => (<button key={c.id} className="color-dot" style={{ backgroundColor: c.color }} onClick={() => applyHighlight(c.color)} />))}<button className="color-dot clear" onClick={() => applyHighlight(null)}>×</button></div>
                  <div className="menu-footer">
                    {(() => {
                      const vKey = `${passage.book}_${passage.chapter}_${activeVerseMenu.verse.verse}`;
                      const hasNotes = notes[vKey]?.length > 0;
                      return hasNotes ? (
                        <>
                          <button className="menu-action" onClick={() => { setActiveVerseForNote(activeVerseMenu.verse); setIsStudyOpen(true); setActiveVerseMenu(null); }}>
                            <span className="icon">📋</span> View Notes
                          </button>
                          <button className="menu-action" onClick={() => { setActiveVerseForNote(activeVerseMenu.verse); setIsStudyOpen(true); setActiveVerseMenu(null); }}>
                            <span className="icon">✎</span> Add New Note
                          </button>
                        </>
                      ) : (
                        <button className="menu-action" onClick={() => { setActiveVerseForNote(activeVerseMenu.verse); setIsStudyOpen(true); setActiveVerseMenu(null); }}>
                          <span className="icon">✎</span> Add Study Note
                        </button>
                      );
                    })()}
                    <button className="menu-action" onClick={() => { setActiveVerseForCommentary(activeVerseMenu.verse); setIsCommentaryOpen(true); setActiveVerseMenu(null); }}>
                      <span className="icon">📖</span> View Commentary
                    </button>
                    <button className="menu-action" onClick={() => { setActiveVerseForArt(activeVerseMenu.verse); setIsArtShareOpen(true); setActiveVerseMenu(null); }}>
                      <span className="icon">🎨</span> Share as Image
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Side Navigation */}
        {!isSettingsOpen && (
          <>
            <button className={`side-nav-btn prev ${isNavVisible ? 'visible' : ''}`} style={{ left: '20px' }} onClick={(e) => { e.stopPropagation(); navigateChapter('prev'); }}><span>←</span></button>
            <button className={`side-nav-btn next ${isNavVisible ? 'visible' : ''}`} style={{ right: '20px' }} onClick={(e) => { e.stopPropagation(); navigateChapter('next'); }}><span>→</span></button>
          </>
        )}

        <SearchPanel isOpen={activePanel === 'search'} onClose={() => setActivePanel(null)} translation={translation} onSelectResult={(res) => { setPassage({ book: res.book_name, chapter: res.chapter, verse: res.verse }); setActivePanel(null); setIsSettingsOpen(false); }} />
        <LibraryPanel 
          isOpen={activePanel === 'library'} 
          onClose={() => setActivePanel(null)} 
          history={history} 
          bookmarks={bookmarks} 
          notes={notes}
          onDeleteNote={(verseKey, noteId) => removeNoteEntry(verseKey, noteId)}
          onSelectPassage={(p) => { 
            if (isAudioPlaying) setAutoPlayNext(true);
            setPassage(p); 
            setTranslation(p.translation || translation); 
            setActivePanel(null); 
            setIsSettingsOpen(false); 
          }} 
        />
        <ReadingPlanPanel isOpen={activePanel === 'plans'} onClose={() => setActivePanel(null)} onNavigate={(p) => { if (isAudioPlaying) setAutoPlayNext(true); setPassage(p); setActivePanel(null); setIsSettingsOpen(false); }} />
        <PrayerPanel isOpen={activePanel === 'prayer'} onClose={() => setActivePanel(null)} />
      </main>

      {isStudyOpen && !isSettingsOpen && (
        <aside className="sidebar-right">
          <StudyPanel
            activeVerse={activeVerseForNote}
            verseKey={`${passage.book}_${passage.chapter}_${activeVerseForNote?.verse}`}
            entries={notes[`${passage.book}_${passage.chapter}_${activeVerseForNote?.verse}`] || []}
            onSaveEntry={addOrUpdateNoteEntry}
            onDeleteEntry={removeNoteEntry}
            onClose={() => setIsStudyOpen(false)}
          />
        </aside>
      )}

      {isArtShareOpen && activeVerseForArt && (
        <ArtShareModal 
          verse={activeVerseForArt} 
          book={passage.book} 
          chapter={passage.chapter} 
          onClose={() => setIsArtShareOpen(false)} 
        />
      )}

      {isAboutOpen && (
        <AboutModal onClose={() => setIsAboutOpen(false)} />
      )}

      <style>{`
        .nav-link { background: none !important; border: none !important; box-shadow: none !important; color: var(--text-muted); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; cursor: pointer; transition: var(--transition-smooth); padding: 5px 0; outline: none; }
        .nav-link:hover { color: var(--accent-gold); background: none !important; }
        .nav-link.gold { color: var(--accent-gold); }
        .sidebar-left.closed { width: 0; }
        .sidebar-left.open { width: 300px; border-right: 1px solid var(--accent-soft); }
        .side-nav-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 50px; height: 80px; background: rgba(var(--bg-surface-rgb), 0.3); backdrop-filter: blur(20px); border: 1px solid var(--accent-soft); color: var(--accent-gold); font-size: 1.2rem; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; pointer-events: none; transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); z-index: 500; }
        .side-nav-btn.prev { border-radius: 40px 15px 15px 40px; }
        .side-nav-btn.next { border-radius: 15px 40px 40px 15px; }
        .side-nav-btn.visible { opacity: 0.3; pointer-events: auto; }
        .side-nav-btn:hover { background: rgba(var(--accent-gold-rgb), 0.15); border-color: var(--accent-gold); transform: translateY(-50%) scale(1.05); opacity: 1 !important; }

        /* Apple Air Dropdown Menu */
        .menu-trigger { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; gap: 5px; padding: 8px; border-radius: 8px; transition: background 0.2s; outline: none; }
        .menu-trigger span { display: block; width: 18px; height: 1.5px; background: var(--text-muted); border-radius: 2px; transition: var(--transition-smooth); }
        .menu-trigger:hover span { background: var(--accent-gold); }
        .air-dropdown { position: absolute; top: calc(100% + 12px); right: 0; min-width: 210px; background: var(--bg-surface); border: 1px solid var(--accent-soft); border-radius: 16px; padding: 8px; display: flex; flex-direction: column; gap: 2px; backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); z-index: 9999; animation: airIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: none; }
        [data-theme='modern-sacred'] .air-dropdown { background: rgba(18,18,20,0.92); }
        [data-theme='sepia'] .air-dropdown { background: rgba(253,246,227,0.95); }
        [data-theme='light'] .air-dropdown { background: rgba(255,255,255,0.95); }
        [data-theme='midnight'] .air-dropdown { background: rgba(17, 24, 39, 0.95); }
        [data-theme='forest'] .air-dropdown { background: rgba(27, 41, 31, 0.95); }
        [data-theme='lavender'] .air-dropdown { background: rgba(56, 52, 67, 0.95); }
        .air-item { background: none; border: none; color: var(--text-secondary); font-size: 0.8rem; font-weight: 500; text-align: left; padding: 10px 14px; border-radius: 10px; cursor: pointer; width: 100%; transition: var(--transition-smooth); letter-spacing: 0.3px; display: flex; align-items: center; gap: 10px; }
        .air-item:hover { background: rgba(197,160,89,0.08); color: var(--accent-gold); }
        .air-item.active { color: var(--accent-gold); font-weight: 700; }
        .air-icon { font-size: 0.95rem; width: 20px; text-align: center; opacity: 0.7; flex-shrink: 0; filter: grayscale(1); }
        .air-item:hover .air-icon, .air-item.active .air-icon { opacity: 1; }
        .air-divider { height: 1px; background: var(--accent-soft); margin: 4px 8px; }

        .verse-menu { background: var(--bg-surface); border: 1px solid var(--accent-soft); border-radius: 18px; padding: 8px; display: flex; flex-direction: column; gap: 4px; min-width: 200px; backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); background-color: rgba(var(--bg-surface-rgb), 0.9); animation: airIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: none !important; }
        [data-theme='modern-sacred'] .verse-menu { background-color: rgba(18, 18, 20, 0.9); }
        [data-theme='sepia'] .verse-menu { background-color: rgba(253, 246, 227, 0.9); }
        [data-theme='light'] .verse-menu { background-color: rgba(255, 255, 255, 0.9); }
        [data-theme='midnight'] .verse-menu { background-color: rgba(17, 24, 39, 0.9); }
        [data-theme='forest'] .verse-menu { background-color: rgba(27, 41, 31, 0.9); }
        [data-theme='lavender'] .verse-menu { background-color: rgba(56, 52, 67, 0.9); }
        option { background-color: var(--bg-elevated); color: var(--text-primary); }
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
        @keyframes airIn { from { opacity: 0; transform: scale(0.96) translateY(-6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
      
      {isCommentaryOpen && !isSettingsOpen && (
        <aside className="sidebar-right">
          <CommentaryPanel
            passage={passage}
            activeVerse={activeVerseForCommentary}
            settings={settings}
            onClose={() => { setIsCommentaryOpen(false); setActiveVerseForCommentary(null); }}
          />
        </aside>
      )}
      </div>
    </div>
  );
};

export default App;
