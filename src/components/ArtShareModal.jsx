import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import './ArtShareModal.css';

const GRADIENTS = [
  { name: 'Sacred Dark', css: 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1c 100%)' },
  { name: 'Dawn', css: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
  { name: 'Midnight', css: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { name: 'Gilded', css: 'linear-gradient(135deg, #c5a059 0%, #8b6e3f 100%)' },
  { name: 'Ocean', css: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)' },
  { name: 'Forest', css: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
];

const FONTS = [
  { name: 'Serif', family: '"Playfair Display", serif' },
  { name: 'Sans', family: '"Poppins", sans-serif' },
  { name: 'Compact', family: '"Inter", sans-serif' },
];

const ArtShareModal = ({ verse, book, chapter, onClose }) => {
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [font, setFont] = useState(FONTS[0]);
  const [fontSize, setFontSize] = useState(24);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef(null);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Biblica_${book}_${chapter}_${verse.verse}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="art-share-overlay">
      <div className="art-share-container">
        <header className="art-share-header">
          <h2>Sacred Art Share</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </header>

        <div className="art-share-content">
          <div className="preview-section">
            <div 
              ref={cardRef}
              className="art-card"
              style={{ 
                background: gradient.css,
                fontFamily: font.family
              }}
            >
              <div className="art-card-inner">
                <div className="quote-mark">“</div>
                <p className="verse-text" style={{ fontSize: `${fontSize}px` }}>
                  {verse.text}
                </p>
                <div className="verse-reference">
                  <span className="ref-book">{book}</span>
                  <span className="ref-chapter">{chapter}:{verse.verse}</span>
                </div>
                <div className="biblica-watermark">BIBLICA</div>
              </div>
            </div>
          </div>

          <div className="controls-section">
            <div className="control-group">
              <label>Background</label>
              <div className="gradient-grid">
                {GRADIENTS.map((g) => (
                  <button 
                    key={g.name}
                    className={`gradient-swatch ${gradient.name === g.name ? 'active' : ''}`}
                    style={{ background: g.css }}
                    onClick={() => setGradient(g)}
                    title={g.name}
                  />
                ))}
              </div>
            </div>

            <div className="control-group">
              <label>Typography</label>
              <div className="font-selector">
                {FONTS.map((f) => (
                  <button 
                    key={f.name}
                    className={`font-btn ${font.name === f.name ? 'active' : ''}`}
                    style={{ fontFamily: f.family }}
                    onClick={() => setFont(f)}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <label>Size: {fontSize}px</label>
              <input 
                type="range" 
                min="16" 
                max="48" 
                value={fontSize} 
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="size-slider"
              />
            </div>

            <button 
              className="export-btn" 
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Generating...' : 'Export Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtShareModal;
