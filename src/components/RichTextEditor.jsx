import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import './RichTextEditor.css';
import bibleData from '../data/bible-meta.json';
import { fetchPassage } from '../services/bibleService';

const bookNames = bibleData.books.map(b => b.book).sort((a,b) => b.length - a.length);
const bookPattern = bookNames.map(name => name.replace(/ /g, '\\s+')).join('|');
const verseRegex = new RegExp(`\\b(${bookPattern})\\s+\\d+:\\d+(?:-\\d+)?\\b`, 'gi');

const RichTextEditor = ({ content, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const flyoutRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [flyoutData, setFlyoutData] = useState(null);

  // Keep the ref pointing at the latest onChange so Quill's listener never goes stale
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target)) {
        setFlyoutData(null);
      }
    };
    if (flyoutData) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [flyoutData]);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: placeholder || 'Record your meditations...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['clean']
          ]
        }
      });

      quillRef.current.on('text-change', (delta, oldDelta, source) => {
        if (source === 'user') {
          const text = quillRef.current.getText();
          let match;
          verseRegex.lastIndex = 0;
          while ((match = verseRegex.exec(text)) !== null) {
            const index = match.index;
            const length = match[0].length;
            const currentFormat = quillRef.current.getFormat(index, length);
            if (!currentFormat.link || currentFormat.link !== `#bible:${match[0]}`) {
              quillRef.current.formatText(index, length, 'link', `#bible:${match[0]}`, 'api');
            }
          }
        }
        const html = quillRef.current.root.innerHTML;
        // Use the ref so we always call the latest onChange (avoids stale closure)
        onChangeRef.current(html);
      });

      quillRef.current.root.addEventListener('click', async (e) => {
        let target = e.target;
        if (target.tagName !== 'A' && target.parentElement?.tagName === 'A') {
           target = target.parentElement;
        }
        if (target.tagName === 'A' && target.href.includes('#bible:')) {
          e.preventDefault();
          e.stopPropagation();
          const ref = decodeURIComponent(target.href.split('#bible:')[1]);
          const rect = target.getBoundingClientRect();
          
          setFlyoutData({ loading: true, x: rect.left, y: rect.bottom, ref });
          
          try {
             const lastSpace = ref.lastIndexOf(' ');
             const book = ref.substring(0, lastSpace);
             const cv = ref.substring(lastSpace + 1);
             const [chapter, verseObj] = cv.split(':');
             const verseNum = verseObj ? verseObj.split('-')[0] : null;
             
             const data = await fetchPassage(book, chapter, verseNum, 'kjv');
             
             setFlyoutData({ 
               loading: false, 
               x: rect.left, 
               y: Math.min(rect.bottom + 10, window.innerHeight - 250), 
               data,
               ref
             });
          } catch (err) {
             setFlyoutData({ loading: false, error: true, x: rect.left, y: rect.bottom, ref });
          }
        }
      });
    }
  }, []);

  useEffect(() => {
    if (quillRef.current && content !== quillRef.current.root.innerHTML) {
      const selection = quillRef.current.getSelection();
      quillRef.current.root.innerHTML = content || '';
      if (selection) {
        quillRef.current.setSelection(selection);
      }
    }
  }, [content]);

  return (
    <div className="quill-editor-container">
      <div ref={editorRef} />
      
      {flyoutData && (
        <div 
          ref={flyoutRef}
          className="passage-flyout"
          style={{ left: `${flyoutData.x}px`, top: `${flyoutData.y}px` }}
        >
          <h4>{flyoutData.ref}</h4>
          {flyoutData.loading ? (
            <div className="loading">Fetching sacred text...</div>
          ) : flyoutData.error ? (
            <div className="loading" style={{color: 'var(--accent-red, #e74c3c)'}}>Failed to fetch passage.</div>
          ) : flyoutData.data ? (
            <p>{flyoutData.data.text || (flyoutData.data.verses && flyoutData.data.verses[0]?.text)}</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
