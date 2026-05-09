import React, { useState, useEffect } from 'react';
import { fetchCommentary } from '../services/bibleService';
import './CommentaryPanel.css';

const COMMENTARIES = [
  { id: 'adam-clarke', name: 'Adam Clarke Commentary' },
  { id: 'tyndale', name: 'Tyndale Open Study Notes' }
];

const CommentaryPanel = ({ passage, activeVerse, settings, onClose }) => {
  const [commentaryId, setCommentaryId] = useState('tyndale');
  const [commentaryData, setCommentaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCommentary = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCommentary(commentaryId, passage.book, passage.chapter);
        setCommentaryData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadCommentary();
  }, [commentaryId, passage.book, passage.chapter]);

  // Extract content related to the specific verse if provided, else show chapter intro/all
  const renderContent = () => {
    if (!commentaryData || !commentaryData.chapter) return null;

    let items = commentaryData.chapter.content || [];
    
    // If a verse is clicked, we try to filter content specifically for that verse if the API structure allows it.
    // The Free Use Bible API commentary content often has `type: 'verse_commentary'` or similar, 
    // or just chunks. We'll render all strings we can extract for now.
    
    // Simple parser: Extract all text from content array
    const extractText = (contentArray) => {
      if (!Array.isArray(contentArray)) return '';
      return contentArray.map(c => {
        if (typeof c === 'string') return c;
        if (c && typeof c === 'object' && c.text) return c.text;
        return '';
      }).join('');
    };

    return items.map((item, index) => {
      // If activeVerse is specified, only show that verse's commentary or chapter headings/intros
      if (activeVerse && item.type === 'verse' && item.number !== activeVerse.verse) {
        return null;
      }

      if (item.type === 'heading') {
        return <h3 key={index}>{extractText(item.content)}</h3>;
      }
      
      if (item.type === 'paragraph' || item.type === 'verse_commentary' || item.type === 'note' || item.type === 'verse') {
        const text = extractText(item.content);
        if (!text.trim()) return null;
        
        return (
          <p key={index} className={`commentary-item ${activeVerse && item.number === activeVerse.verse ? 'highlighted' : ''}`}>
            {item.number && <span className="verse-num">{item.number}</span>}
            {text}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <div className="study-panel">
      <header className="study-header">
        <div className="study-title" style={{ flex: 1 }}>
          <span className="verse-tag">
            {passage.book} {passage.chapter}{activeVerse ? `:${activeVerse.verse}` : ''}
          </span>
          <select 
            value={commentaryId} 
            onChange={e => setCommentaryId(e.target.value)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)', 
              fontWeight: '600', 
              fontSize: '1rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {COMMENTARIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button className="close-panel" onClick={onClose}>&times;</button>
      </header>
      
      <div className="study-content" style={{ overflowY: 'auto' }}>
        {loading && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px' }}>Loading insights...</div>}
        {error && <div style={{ color: 'var(--accent-ruby)', padding: '20px' }}>{error}</div>}
        {!loading && !error && (
          <div className="commentary-text" style={{ fontSize: `${settings?.commentaryFontSize || 1.0}rem`, lineHeight: settings?.lineHeight || 1.6 }}>
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentaryPanel;
