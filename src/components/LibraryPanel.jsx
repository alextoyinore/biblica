import React from 'react';
import './LibraryPanel.css';

const LibraryPanel = ({ isOpen, onClose, history, bookmarks, onSelectPassage }) => {
  if (!isOpen) return null;

  return (
    <div className="overlay-panel library-view">
      <div className="library-container">
        <header className="library-header">
          <h2 className="library-title">Library</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </header>

        <div className="library-content">
          <section className="library-section">
            <h3 className="section-label">Recently Read</h3>
            <div className="library-list">
              {history.length === 0 && <div className="empty-state">No history yet.</div>}
              {history.map((item, index) => (
                <div key={index} className="library-item-minimal history" onClick={() => onSelectPassage(item)}>
                  <div className="item-meta-minimal">{item.book} {item.chapter} • {item.translation?.toUpperCase()}</div>
                  <div className="item-text-minimal snippet">
                    {item.text || 'Continue reading...'}
                  </div>
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
