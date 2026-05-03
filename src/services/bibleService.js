const BASE_URL = 'https://bible-api.com';

// Dynamic loaders for local translations to keep bundle size small
const LOCAL_LOADERS = {
  kjv: () => import('../data/translations/kjv_opt.json'),
  bbe: () => import('../data/translations/bbe_opt.json')
};

const TRANSLATION_NAMES = {
  kjv: 'King James Version',
  bbe: 'Bible in Basic English',
  asv: 'American Standard Version',
  web: 'World English Bible'
};

export const fetchPassage = async (book, chapter, verse, translation = 'kjv') => {
  // 1. Try local bundle first
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
