import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const POWER_VERSES = [
  { text: "For God has not given us a spirit of fear, but of power and of love and of a sound mind.", ref: "2 Timothy 1:7" },
  { text: "The LORD is my shepherd; I shall not want.", ref: "Psalms 23:1" },
  { text: "Be still, and know that I am God.", ref: "Psalms 46:10" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.", ref: "Isaiah 40:31" },
  { text: "In the beginning was the Word, and the Word was with God, and the Word was God.", ref: "John 1:1" },
  { text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", ref: "Jeremiah 29:11" }
];

const Dashboard = ({ onNavigate, lastPassage }) => {
  const [votd, setVotd] = useState(POWER_VERSES[0]);

  useEffect(() => {
    // Select verse based on day of the year
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    setVotd(POWER_VERSES[dayOfYear % POWER_VERSES.length]);
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-bg-glow"></div>
      
      <header className="dashboard-header">
        <div className="dashboard-logo">BIBLICA</div>
        <div className="dashboard-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </header>

      <main className="dashboard-content">
        <section className="votd-section">
          <span className="votd-label">VERSE OF THE DAY</span>
          <p className="votd-text">"{votd.text}"</p>
          <span className="votd-ref">{votd.ref}</span>
          <button className="votd-read-btn" onClick={() => {
            const [book, rest] = votd.ref.split(' ');
            const [chapter, verse] = rest.split(':');
            onNavigate({ book, chapter: parseInt(chapter), verse: parseInt(verse) });
          }}>
            READ FULL PASSAGE
          </button>
        </section>

        <section className="quick-actions">
          <div className="action-card" onClick={() => onNavigate(lastPassage)}>
            <span className="action-icon">📖</span>
            <div className="action-info">
              <h3>Continue Reading</h3>
              <p>{lastPassage.book} {lastPassage.chapter}</p>
            </div>
          </div>
          <div className="action-card" onClick={() => onNavigate('bookmarks')}>
            <span className="action-icon">🔖</span>
            <div className="action-info">
              <h3>Bookmarks</h3>
              <p>Your saved verses</p>
            </div>
          </div>
          <div className="action-card" onClick={() => onNavigate('search')}>
            <span className="action-icon">🔍</span>
            <div className="action-info">
              <h3>Search</h3>
              <p>Find scriptures</p>
            </div>
          </div>
          <div className="action-card" onClick={() => onNavigate('plans')}>
            <span className="action-icon">📅</span>
            <div className="action-info">
              <h3>Reading Plans</h3>
              <p>Track your progress</p>
            </div>
          </div>
          <div className="action-card" onClick={() => onNavigate('prayer')}>
            <span className="action-icon">🙏</span>
            <div className="action-info">
              <h3>Prayer Journal</h3>
              <p>Sacred conversations</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>Offline Mode Active • High Performance Engine</p>
      </footer>
    </div>
  );
};

export default Dashboard;
