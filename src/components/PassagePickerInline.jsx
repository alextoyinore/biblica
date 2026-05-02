import React, { useState } from 'react';
import bibleData from '../data/bible-meta.json';
import './PassagePickerInline.css';

const PassagePickerInline = ({ currentPassage, onSelect }) => {
  const [step, setStep] = useState('book'); // 'book', 'chapter', 'verse'
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setStep('chapter');
  };

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
    setStep('verse');
  };

  const handleVerseSelect = (verse) => {
    onSelect({ book: selectedBook.book, chapter: selectedChapter, verse });
    reset();
  };

  const reset = () => {
    setStep('book');
    setSelectedBook(null);
    setSelectedChapter(null);
  };

  const oldTestament = bibleData.books.slice(0, 39);
  const newTestament = bibleData.books.slice(39);

  return (
    <div className="picker-inline">
      <div className="picker-nav">
        {step !== 'book' && <button className="text-link" onClick={() => setStep(step === 'verse' ? 'chapter' : 'book')}>← Back</button>}
        <span className="picker-current-step">{step.toUpperCase()}</span>
      </div>

      <div className="picker-scroll-area">
        {step === 'book' && (
          <div className="book-grid-container">
            <div className="testament-label">Old Testament</div>
            <div className="inline-grid books">
              {oldTestament.map((b, i) => (
                <button 
                  key={i} 
                  className={`inline-item abbr ${currentPassage.book === b.book ? 'active' : ''}`}
                  onClick={() => handleBookSelect(b)}
                  title={b.book}
                >
                  {b.abbr}
                </button>
              ))}
            </div>
            
            <div className="testament-separator"></div>
            
            <div className="testament-label">New Testament</div>
            <div className="inline-grid books">
              {newTestament.map((b, i) => (
                <button 
                  key={i} 
                  className={`inline-item abbr ${currentPassage.book === b.book ? 'active' : ''}`}
                  onClick={() => handleBookSelect(b)}
                  title={b.book}
                >
                  {b.abbr}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'chapter' && (
          <div className="inline-grid numbers">
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(c => (
              <button 
                key={c} 
                className={`inline-item ${currentPassage.chapter === c && currentPassage.book === selectedBook.book ? 'active' : ''}`}
                onClick={() => handleChapterSelect(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {step === 'verse' && (
          <div className="inline-grid numbers">
            <button 
              className="inline-item all"
              onClick={() => {
                onSelect({ book: selectedBook.book, chapter: selectedChapter, verse: null });
                reset();
              }}
            >
              All
            </button>
            {Array.from({ length: 50 }, (_, i) => i + 1).map(v => (
              <button 
                key={v} 
                className={`inline-item ${currentPassage.verse === v ? 'active' : ''}`}
                onClick={() => handleVerseSelect(v)}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassagePickerInline;
