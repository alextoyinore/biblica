const BASE_URL = 'https://bible-api.com';

export const fetchPassage = async (book, chapter, verse, translation = 'kjv') => {
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
