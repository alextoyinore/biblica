import React, { useState, useEffect, useRef, useCallback } from 'react';
import RichTextEditor from './RichTextEditor.jsx';
import './StudyPanel.css';

const generateNoteId = (verseKey) => `${verseKey}_${Date.now()}`;
const AUTOSAVE_DELAY = 800; // ms

const StudyPanel = ({ activeVerse, verseKey, entries = [], onSaveEntry, onDeleteEntry, onClose }) => {
  const [view, setView] = useState(entries.length > 0 ? 'list' : 'editor');
  const [activeEntry, setActiveEntry] = useState(null);

  const [editTitle, setEditTitle]     = useState('');
  const [editContent, setEditContent] = useState('');
  const [editNoteId, setEditNoteId]   = useState(null);
  const [saveStatus, setSaveStatus]   = useState('idle'); // 'idle' | 'saving' | 'saved'

  const debounceTimer = useRef(null);

  // ── Auto-save whenever title or content changes ────────────
  const triggerSave = useCallback((noteId, content, title) => {
    if (!noteId) return;
    clearTimeout(debounceTimer.current);
    setSaveStatus('saving');
    debounceTimer.current = setTimeout(async () => {
      await onSaveEntry(verseKey, noteId, content, title);
      setSaveStatus('saved');
      // Reset status label after a moment
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, AUTOSAVE_DELAY);
  }, [verseKey, onSaveEntry]);

  useEffect(() => {
    if (view === 'editor') {
      triggerSave(editNoteId, editContent, editTitle);
    }
    return () => clearTimeout(debounceTimer.current);
  }, [editTitle, editContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── If all entries are deleted, switch to fresh editor ────
  useEffect(() => {
    if (entries.length === 0) {
      setView('editor');
      setActiveEntry(null);
    }
  }, [entries.length]);

  // ── Ensure a noteId exists when entering editor fresh ─────
  useEffect(() => {
    if (view === 'editor' && !editNoteId) {
      setEditNoteId(generateNoteId(verseKey));
    }
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEntry = (entry) => {
    clearTimeout(debounceTimer.current);
    setActiveEntry(entry);
    setEditTitle(entry.title || '');
    setEditContent(entry.content || '');
    setEditNoteId(entry.noteId);
    setSaveStatus('idle');
    setView('editor');
  };

  const openNew = () => {
    clearTimeout(debounceTimer.current);
    setActiveEntry(null);
    setEditTitle('');
    setEditContent('');
    setEditNoteId(generateNoteId(verseKey));
    setSaveStatus('idle');
    setView('editor');
  };

  const handleDelete = (noteId, e) => {
    e.stopPropagation();
    onDeleteEntry(verseKey, noteId);
    if (noteId === editNoteId) {
      setView('list');
      setActiveEntry(null);
    }
  };

  if (!activeVerse) return null;

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Auto-saved to your device.';

  return (
    <div className="study-panel">
      <header className="study-header">
        <div className="study-title">
          <span className="verse-tag">Verse {activeVerse.verse}</span>
          {view === 'editor' ? (
            <input
              type="text"
              className="note-title-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Untitled Meditation"
            />
          ) : (
            <span className="study-panel-heading">
              {entries.length} Note{entries.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {view === 'list' && (
            <button className="sp-new-btn" onClick={openNew} title="New note">＋</button>
          )}
          {view === 'editor' && entries.length > 0 && (
            <button className="sp-back-btn" onClick={() => setView('list')}>‹ All</button>
          )}
          <button className="close-panel" onClick={onClose}>×</button>
        </div>
      </header>

      {view === 'list' ? (
        <div className="sp-notes-list">
          {entries.map((entry) => (
            <div key={entry.noteId} className="sp-note-card" onClick={() => openEntry(entry)}>
              <div className="sp-note-card-header">
                <span className="sp-note-card-title">{entry.title || 'Untitled'}</span>
                <button className="sp-delete-btn" onClick={(e) => handleDelete(entry.noteId, e)} title="Delete note">×</button>
              </div>
              <div
                className="sp-note-card-snippet"
                dangerouslySetInnerHTML={{
                  __html: (entry.content || '').replace(/<[^>]+>/g, ' ').substring(0, 100) + '...'
                }}
              />
              <span className="sp-note-card-date">{formatDate(entry.timestamp)}</span>
            </div>
          ))}
          <button className="sp-add-new-card" onClick={openNew}>
            <span>＋</span> Add another note
          </button>
        </div>
      ) : (
        <div className="study-content">
          <RichTextEditor
            content={editContent}
            onChange={(html) => setEditContent(html)}
            placeholder="Record your meditations here..."
          />
          <div className="sp-editor-footer">
            <span className={`study-footer ${saveStatus}`}>{statusLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPanel;
