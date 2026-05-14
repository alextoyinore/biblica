import React from 'react';
import './LibraryPanel.css';

const LibraryPanel = ({ isOpen, onClose, history, bookmarks, notes = {}, onDeleteNote, onSelectPassage }) => {
  if (!isOpen) return null;

  // Flatten all per-verse entry arrays into a single sorted list
  const notesList = Object.entries(notes)
    .flatMap(([verseKey, entries]) => {
      const parts = verseKey.split('_');
      const book = parts[0];
      const chapter = parts[1];
      const verse = parts[2];
      const entryArray = Array.isArray(entries) ? entries : [];
      return entryArray.map(entry => ({
        id: verseKey,           // used for navigation
        noteId: entry.noteId,
        book, chapter, verse,
        title: entry.title,
        content: entry.content,
        timestamp: entry.timestamp
      }));
    })
    .filter(n => n.content || n.title)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return (
    <div className="library-overlay">
      <div className="library-container">
        <header className="library-header">
          <button className="back-nav" onClick={onClose}>← Back</button>
          <h2 className="library-title">Library</h2>
        </header>

        <div className="library-content">
          {notesList.length > 0 && (
            <section className="library-section">
              <h3 className="section-label">Your Notes</h3>
              <div className="library-list">
                {notesList.map((item) => (
                  <div key={item.noteId} className="library-item-minimal note" onClick={() => onSelectPassage(item)}>
                    <div className="item-meta-minimal">
                      <div className="note-header-row">
                        <span className="note-title-preview">{item.title || 'Untitled Note'}</span>
                        <button 
                          className="delete-item-btn" 
                          onClick={(e) => { e.stopPropagation(); onDeleteNote(item.id, item.noteId); }}
                          title="Delete Note"
                        >
                          &times;
                        </button>
                      </div>
                      <span className="note-ref-preview">{item.book} {item.chapter}:{item.verse}</span>
                    </div>
                    <div className="item-text-minimal snippet" dangerouslySetInnerHTML={{ 
                      __html: item.content?.substring(0, 120) + (item.content?.length > 120 ? '...' : '') 
                    }} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="library-section">
            <h3 className="section-label">Recently Read</h3>
            <div className="library-grid history-grid">
              {history.length === 0 && <div className="empty-state">No history yet.</div>}
              {history.map((item, index) => (
                <div key={index} className="library-grid-item history" onClick={() => onSelectPassage(item)}>
                  <div className="item-meta-minimal">{item.book} {item.chapter}</div>
                  <div className="item-translation-tag">{item.translation?.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="library-section">
            <h3 className="section-label">Bookmarks</h3>
            <div className="library-list">
              {bookmarks.length === 0 && <div className="empty-state">No bookmarks saved.</div>}
              {bookmarks.map((item, index) => (
                <div key={index} className="library-item-minimal bookmark" onClick={() => onSelectPassage(item)}>
                  <div className="item-meta-minimal">{item.book} {item.chapter}:{item.verse} • {item.translation?.toUpperCase()}</div>
                  <div className="item-text-minimal">
                    {item.text?.substring(0, 150)}{item.text?.length > 150 ? '...' : ''}
                    <span className="view-verse-link">View Verse</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LibraryPanel;
