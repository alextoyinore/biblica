import React from 'react';
import RichTextEditor from './RichTextEditor.jsx';
import './StudyPanel.css';

const StudyPanel = ({ activeVerse, note, onUpdateNote, onClose }) => {
  if (!activeVerse) return null;

  const noteContent = typeof note === 'string' ? note : (note?.content || '');
  const noteTitle = note?.title || '';

  return (
    <div className="study-panel">
      <header className="study-header">
        <div className="study-title">
          <span className="verse-tag">Verse {activeVerse.verse}</span>
          <input 
            type="text" 
            className="note-title-input"
            value={noteTitle}
            onChange={(e) => onUpdateNote(activeVerse.verse, noteContent, e.target.value)}
            placeholder="Untitled Meditation"
          />
        </div>
        <button className="close-panel" onClick={onClose}>&times;</button>
      </header>
      
      <div className="study-content">
        <RichTextEditor 
          content={noteContent}
          onChange={(text) => onUpdateNote(activeVerse.verse, text, noteTitle)}
          placeholder="Record your meditations here..."
        />
        <div className="study-footer">
          Saved automatically to your device.
        </div>
      </div>
    </div>
  );
};

export default StudyPanel;
