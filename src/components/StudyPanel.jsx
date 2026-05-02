import React from 'react';
import RichTextEditor from './RichTextEditor.jsx';
import './StudyPanel.css';

const StudyPanel = ({ activeVerse, note, onUpdateNote, onClose }) => {
  if (!activeVerse) return null;

  return (
    <div className="study-panel">
      <header className="study-header">
        <div className="study-title">
          <span className="verse-tag">Verse {activeVerse.verse}</span>
          <h3>Study Notes</h3>
        </div>
        <button className="close-panel" onClick={onClose}>&times;</button>
      </header>
      
      <div className="study-content">
        <RichTextEditor 
          content={note}
          onChange={(text) => onUpdateNote(activeVerse.verse, text)}
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
