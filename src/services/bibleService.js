import { BOOK_TO_ID } from '../constants/bible';
import * as db from './db';

const passageCache = new Map();
const commentaryCache = new Map();

// Dynamic loaders for local translations
const LOCAL_LOADERS = {
  kjv: () => import('../data/translations/kjv_opt.json'),
  bbe: () => import('../data/translations/bbe_opt.json'),
  yor: () => import('../data/translations/yor_opt.json')
};

// Map clean IDs from UI to HelloAO API IDs
const API_ID_MAP = {
  asv: 'eng_asv',
  web: 'eng_web',
  dby: 'eng_dby',
  dra: 'eng_dra',
  ylt: 'eng_ylt',
  bsb: 'BSB'
};

const TRANSLATION_NAMES = {
  kjv: 'King James Version',
  bbe: 'Bible in Basic English',
  yor: 'Yoruba Bible',
  asv: 'American Standard Version',
  web: 'World English Bible',
  dby: 'Darby Translation',
  dra: 'Douay-Rheims 1899',
  ylt: 'Young\'s Literal Translation',
  bsb: 'Berean Standard Bible',
};

export const fetchPassage = async (book, chapter, verse, translation = 'kjv') => {
  try {
    let formattedVerses = null;
    const cacheKey = `${translation}_${book}_${chapter}`;

    if (LOCAL_LOADERS[translation]) {
      const bundle = await LOCAL_LOADERS[translation]();
      const bookData = bundle.default ? bundle.default[book] : bundle[book];
      
      if (bookData && bookData[chapter]) {
        const versesList = bookData[chapter];
        
        // Map to standard format
        formattedVerses = versesList.map((text, index) => ({
          book_name: book,
          chapter: parseInt(chapter),
          verse: index + 1,
          text: text
        }));
      } else {
        throw new Error(`Passage not found: ${book} ${chapter}`);
      }
    } else {
      // 1. Try memory cache
      if (passageCache.has(cacheKey)) {
        formattedVerses = passageCache.get(cacheKey);
      } else {
        // 2. Try IndexedDB cache
        const localData = await db.getScripture(cacheKey);
        if (localData) {
          formattedVerses = localData;
          passageCache.set(cacheKey, localData);
        } else {
          // 3. Fetch online from bible.helloao.org
          const bookId = BOOK_TO_ID[book];
          if (!bookId) throw new Error(`Unknown book: ${book}`);
          
          const apiTranslationId = API_ID_MAP[translation] || translation;
          const url = `https://bible.helloao.org/api/${apiTranslationId}/${bookId}/${chapter}.json`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);
          const data = await res.json();
          
          const verses = [];
          data.chapter.content.forEach(item => {
              if (item.type === 'verse') {
                  const textParts = item.content.map(c => {
                      if (typeof c === 'string') return c;
                      if (c && typeof c === 'object' && c.text) return c.text;
                      return '';
                  });
                  verses[item.number - 1] = textParts.join('').trim();
              }
          });

          formattedVerses = [];
          for (let i = 0; i < verses.length; i++) {
            if (verses[i] !== undefined) {
              formattedVerses.push({
                book_name: book,
                chapter: parseInt(chapter),
                verse: i + 1,
                text: verses[i]
              });
            }
          }
          
          if (formattedVerses.length === 0) {
              throw new Error(`No verses found in passage: ${book} ${chapter}`);
          }

          // Cache for future
          passageCache.set(cacheKey, formattedVerses);
          db.saveScripture(cacheKey, formattedVerses).catch(e => console.warn('Could not cache scripture to DB:', e));
        }
      }
    }

    const filteredVerses = verse 
      ? formattedVerses.filter(v => v.verse === parseInt(verse))
      : formattedVerses;

    return {
      text: filteredVerses.map(v => v.text).join('\n'),
      verses: filteredVerses,
      reference: verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`,
      translation_name: TRANSLATION_NAMES[translation] || translation.toUpperCase()
    };
  } catch (error) {
    console.error(`Failed to load translation ${translation}:`, error);
    throw new Error(`Error: Unable to load ${TRANSLATION_NAMES[translation] || translation}. ${error.message}`);
  }
};

export const fetchCommentary = async (commentaryId, book, chapter) => {
  const cacheKey = `${commentaryId}_${book}_${chapter}`;
  
  if (commentaryCache.has(cacheKey)) {
    return commentaryCache.get(cacheKey);
  }

  try {
    const localData = await db.getCommentary(cacheKey);
    if (localData) {
      commentaryCache.set(cacheKey, localData);
      return localData;
    }

    const bookId = BOOK_TO_ID[book];
    if (!bookId) throw new Error(`Unknown book: ${book}`);

    const url = `https://bible.helloao.org/api/c/${commentaryId}/${bookId}/${chapter}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch commentary: ${res.status}`);
    const data = await res.json();

    commentaryCache.set(cacheKey, data);
    db.saveCommentary(cacheKey, data).catch(e => console.warn('Could not cache commentary to DB:', e));
    
    return data;
  } catch (err) {
    console.error("fetchCommentary error:", err);
    throw new Error("Unable to load commentary. Check network connection.");
  }
};
