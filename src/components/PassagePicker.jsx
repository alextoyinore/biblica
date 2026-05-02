import React, { useState } from 'react';
import bibleData from '../data/bible-meta.json';
import './PassagePicker.css';

const PassagePicker = ({ isOpen, onClose, onSelect }) => {
  const [step, setStep] = useState(0); // 0: Book, 1: Chapter, 2: Verse
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  if (!isOpen) return null;

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setStep(1);
  };

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
    // For now, let's just complete the selection on chapter click
    // or we can add a verse step. Let's add a simple verse step.
    setStep(2);
  };

  const handleVerseSelect = (verse) => {
    onSelect({
      book: selectedBook.book,
      chapter: selectedChapter,
      verse: verse
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(0);
    setSelectedBook(null);
    setSelectedChapter(null);
    onClose();
  };

  const renderBooks = () => (
    <div className="picker-grid">
      {bibleData.books.map((b) => (
        <button 
          key={b.book} 
          className="picker-item"
          onClick={() => handleBookSelect(b)}
        >
          {b.book}
        </button>
      ))}
    </div>
  );

  const renderChapters = () => {
    const chapters = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
    return (
      <div className="picker-grid numbers">
        {chapters.map((c) => (
          <button 
            key={c} 
            className="picker-item"
            onClick={() => handleChapterSelect(c)}
          >
            {c}
          </button>
        ))}
      </div>
    );
  };

  const renderVerses = () => {
    // Placeholder verse count (30) since we don't have exact counts yet
    const verses = Array.from({ length: 30 }, (_, i) => i + 1);
    return (
      <div className="picker-grid numbers">
        {verses.map((v) => (
          <button 
            key={v} 
            className="picker-item"
            onClick={() => handleVerseSelect(v)}
          >
            {v}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="picker-overlay">
      <div className="picker-header">
        <h2 className="picker-title">Go to...</h2>
        <button className="close-button" onClick={resetAndClose}>&times;</button>
      </div>

      <div className="picker-content">
        <div className="picker-breadcrumbs">
          <span 
            className={`breadcrumb-item ${step >= 0 ? 'active' : ''}`}
            onClick={() => setStep(0)}
          >
            {selectedBook ? selectedBook.book : 'Select Book'}
          </span>
          {selectedBook && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span 
                className={`breadcrumb-item ${step >= 1 ? 'active' : ''}`}
                onClick={() => setStep(1)}
              >
                {selectedChapter ? `Chapter ${selectedChapter}` : 'Chapter'}
              </span>
            </>
          )}
          {selectedChapter && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span className={`breadcrumb-item ${step === 2 ? 'active' : ''}`}>
                Verse
              </span>
            </>
          )}
        </div>

        {step === 0 && renderBooks()}
        {step === 1 && renderChapters()}
        {step === 2 && renderVerses()}
      </div>
    </div>
  );
};

export default PassagePicker;
