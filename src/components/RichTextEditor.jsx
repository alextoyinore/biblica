import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import './RichTextEditor.css';

const RichTextEditor = ({ content, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

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

      quillRef.current.on('text-change', () => {
        const html = quillRef.current.root.innerHTML;
        onChange(html);
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
    </div>
  );
};

export default RichTextEditor;
