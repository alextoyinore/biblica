import React, { useState, useEffect } from 'react';
import * as DB from '../services/db';
import RichTextEditor from './RichTextEditor.jsx';
import './PrayerPanel.css';

const PrayerPanel = ({ isOpen, onClose }) => {
  const [prayers, setPrayers] = useState([]);
  const [activePrayer, setActivePrayer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadPrayers();
    }
  }, [isOpen]);

  const loadPrayers = async () => {
    setLoading(true);
    const data = await DB.getPrayers();
    setPrayers(data);
    setLoading(false);
  };

  const handleSavePrayer = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const prayer = {
      ...activePrayer,
      title: formData.get('title'),
      category: formData.get('category'),
      isAnswered: activePrayer?.isAnswered || false,
    };
    
    if (!prayer.content) {
      alert("Please record your prayer content.");
      return;
    }

    await DB.savePrayer(prayer);
    setIsEditing(false);
    setActivePrayer(null);
    loadPrayers();
  };

  const handleNewPrayer = () => {
    setActivePrayer({
      title: '',
      content: '',
      category: 'personal',
      isAnswered: false
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this prayer?")) {
      await DB.deletePrayer(id);
      loadPrayers();
    }
  };

  const handleToggleAnswered = async (prayer) => {
    await DB.savePrayer({ ...prayer, isAnswered: !prayer.isAnswered });
    loadPrayers();
  };

  if (!isOpen) return null;

  return (
    <div className="prayer-overlay">
      <div className="prayer-container">
        <header className="prayer-header">
          <div className="header-top">
            <button className="back-nav" onClick={onClose}>← Back</button>
          </div>
          <div className="header-bottom">
            <div className="header-left">
              <h2>Prayer Journal</h2>
              <p>{prayers.length} Sacred Conversations</p>
            </div>
            <button className="new-prayer-btn" onClick={handleNewPrayer}>+ Record New Prayer</button>
          </div>
        </header>

        <div className="prayer-content">
          {isEditing ? (
            <form className="prayer-editor" onSubmit={handleSavePrayer}>
              <div className="editor-fields">
                <input 
                  name="title" 
                  defaultValue={activePrayer.title} 
                  placeholder="Prayer Title (e.g., Strength for Today)" 
                  required 
                  autoFocus
                />
                <select name="category" defaultValue={activePrayer.category}>
                  <option value="personal">Personal</option>
                  <option value="family">Family</option>
                  <option value="intercession">Intercession</option>
                  <option value="gratitude">Gratitude</option>
                  <option value="answered">Answered</option>
                </select>
              </div>
              
              <div className="rich-editor-wrapper">
                <RichTextEditor 
                  content={activePrayer.content} 
                  onChange={(val) => setActivePrayer({...activePrayer, content: val})}
                  placeholder="Pour out your heart here..."
                />
              </div>

              <div className="editor-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="save-btn">Save Prayer</button>
              </div>
            </form>
          ) : (
            <div className="prayer-list-wrapper">
              {loading ? (
                <div className="status-message">Ascending to your requests...</div>
              ) : prayers.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🙏</span>
                  <h3>Your journal is empty</h3>
                  <p>Start recording your meditations and requests to track your spiritual journey.</p>
                  <button className="start-btn" onClick={handleNewPrayer}>Begin Your First Entry</button>
                </div>
              ) : (
                <div className="prayer-grid">
                  {prayers.map(prayer => (
                    <div key={prayer.id} className={`prayer-card ${prayer.isAnswered ? 'answered' : ''}`}>
                      <div className="card-header">
                        <span className="prayer-category">{prayer.category}</span>
                        <span className="prayer-date">{new Date(prayer.timestamp).toLocaleDateString()}</span>
                      </div>
                      <h4>{prayer.title}</h4>
                      <div className="prayer-snippet" dangerouslySetInnerHTML={{ __html: prayer.content }}></div>
                      <div className="card-footer">
                        <button className="card-action" onClick={() => { setActivePrayer(prayer); setIsEditing(true); }}>Edit</button>
                        <button className="card-action" onClick={() => handleToggleAnswered(prayer)}>
                          {prayer.isAnswered ? 'Answered ✓' : 'Mark Answered'}
                        </button>
                        <button className="card-action delete" onClick={() => handleDelete(prayer.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrayerPanel;
