import { BOOK_TO_ID, API_BIBLE_ID_MAP } from '../constants/bible';

const BASE_URL = 'https://bible-api.com';

// Dynamic loaders for local translations
const LOCAL_LOADERS = {
  kjv: () => import('../data/translations/kjv_opt.json'),
  bbe: () => import('../data/translations/bbe_opt.json'),
  yor: () => import('../data/translations/yor_opt.json')
};

const TRANSLATION_NAMES = {
  kjv: 'King James Version',
  bbe: 'Bible in Basic English',
  yor: 'Yoruba Bible',
  niv: 'New International Version',
  nlt: 'New Living Translation',
  csb: 'Christian Standard Bible',
  asv: 'American Standard Version',
};

export const fetchPassage = async (book, chapter, verse, translation = 'kjv', apiKey = null) => {
  const activeKey = apiKey || 'PiYBAd42TpQXxU16P547Q';
  
  // 1. Try API.Bible for premium translations
  if (API_BIBLE_ID_MAP[translation]) {
    if (!activeKey) {
      throw new Error(`An API Key is required for ${TRANSLATION_NAMES[translation] || translation}. Please add it in Settings.`);
    }
    try {
      const bibleId = API_BIBLE_ID_MAP[translation];
      const bookId = BOOK_TO_ID[book];
      const chapterId = `${bookId}.${chapter}`;
      
      const response = await fetch(`https://rest.api.bible/v1/bibles/${bibleId}/chapters/${chapterId}?content-type=json`, {
        headers: { 'api-key': activeKey }
      });
      
      if (response.ok) {
        const result = await response.json();
        const content = result.data.content;
        const verses = [];

        if (Array.isArray(content)) {
          // Case 1: JSON structure
          const versesMap = {};
          const traverse = (node) => {
            if (node.type === 'text' && node.attrs && node.attrs.verseId) {
              const parts = node.attrs.verseId.split('.');
              const vNum = parts[parts.length - 1];
              if (!versesMap[vNum]) versesMap[vNum] = '';
              versesMap[vNum] += node.text;
            }
            if (node.items) node.items.forEach(traverse);
          };
          content.forEach(traverse);
          
          Object.entries(versesMap).forEach(([vNum, text]) => {
            verses.push({
              book_name: book,
              chapter: parseInt(chapter),
              verse: parseInt(vNum),
              text: text.trim()
            });
          });
        } else if (typeof content === 'string') {
          // Case 2: HTML string
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');
          // API.Bible uses span with data-number for verses
          const markers = doc.querySelectorAll('span[data-number]');
          markers.forEach((marker) => {
            const vNum = marker.getAttribute('data-number');
            let text = '';
            let next = marker.nextSibling;
            
            // Collect text until next verse marker
            while (next && !(next.nodeType === 1 && next.hasAttribute('data-number'))) {
              text += next.textContent || '';
              next = next.nextSibling;
            }
            
            if (vNum) {
              verses.push({
                book_name: book,
                chapter: parseInt(chapter),
                verse: parseInt(vNum),
                text: text.trim()
              });
            }
          });
        }

        const sortedVerses = verses.sort((a, b) => a.verse - b.verse);
        const filteredVerses = verse 
          ? sortedVerses.filter(v => v.verse === parseInt(verse))
          : sortedVerses;

        return {
          text: filteredVerses.map(v => v.text).join('\n'),
          verses: filteredVerses,
          reference: verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`,
          translation_name: TRANSLATION_NAMES[translation] || translation.toUpperCase()
        };
      } else {
        const errData = await response.json();
        throw new Error(`API.Bible Error: ${errData.message || response.statusText}`);
      }
    } catch (err) {
      console.error('API.Bible fetch failed:', err);
      throw err;
    }
  }

  // 2. Try local bundle
  if (LOCAL_LOADERS[translation]) {
    try {
      const bundle = await LOCAL_LOADERS[translation]();
      const bookData = bundle.default ? bundle.default[book] : bundle[book];
      
      if (bookData && bookData[chapter]) {
        const versesList = bookData[chapter];
        
        // Map to API format
        const formattedVerses = versesList.map((text, index) => ({
          book_name: book,
          chapter: parseInt(chapter),
          verse: index + 1,
          text: text
        }));

        const filteredVerses = verse 
          ? formattedVerses.filter(v => v.verse === parseInt(verse))
          : formattedVerses;

        return {
          text: filteredVerses.map(v => v.text).join('\n'),
          verses: filteredVerses,
          reference: verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`,
          translation_name: TRANSLATION_NAMES[translation] || translation.toUpperCase()
        };
      }
    } catch (localError) {
      console.warn(`Local bundle load failed for ${translation}, falling back to API:`, localError);
    }
  }

  // 2. Fallback to network API
  try {
    const reference = verse 
      ? `${book} ${chapter}:${verse}`
      : `${book} ${chapter}`;
    
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(reference)}?translation=${translation}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch passage: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      text: data.text,
      verses: data.verses,
      reference: data.reference,
      translation_name: data.translation_name
    };
  } catch (error) {
    console.error('Error fetching from Bible API:', error);
    throw error;
  }
};
