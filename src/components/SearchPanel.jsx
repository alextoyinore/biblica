import React, { useState } from 'react';
import './SearchPanel.css';

const SearchPanel = ({ isOpen, onClose, onSelectResult, translation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://getbible.net/v2/${translation}/search/${encodeURIComponent(query)}.json`);
      if (!response.ok) throw new Error('Search service unavailable');
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError('Search failed. Please try a different term.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlay-panel search-view">
      <div className="search-container">
        <header className="search-header">
          <form onSubmit={handleSearch} style={{ flex: 1 }}>
            <input 
              autoFocus
              type="text" 
              placeholder="Search the scriptures..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
          </form>
          <button className="close-button" onClick={onClose}>&times;</button>
        </header>

        <div className="search-results">
          {loading && <div className="search-status">Searching the scrolls...</div>}
          {error && <div className="search-error">{error}</div>}
          {!loading && !error && results.length === 0 && query && (
            <div className="search-status">No results found for "{query}"</div>
          )}
          
          {results.map((result, index) => (
            <div key={index} className="search-result-item" onClick={() => onSelectResult(result)}>
              <div className="result-reference">{result.book_name} {result.chapter}:{result.verse}</div>
              <div className="result-text">{result.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;
