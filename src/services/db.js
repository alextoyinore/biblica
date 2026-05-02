import Dexie from 'dexie';

export const db = new Dexie('BiblicaDB');

// Define database schema
db.version(2).stores({ // Bumped version to 2
  scriptures: 'id', // translation_book_chapter
  notes: 'id',      // book_chapter_verse
  history: '++id, book, chapter, timestamp',
  bookmarks: 'id',  // book_chapter_verse
  highlights: 'id'  // book_chapter_verse
});

// Helper functions
export const saveScripture = async (id, data) => {
  return await db.scriptures.put({ id, data });
};

export const getScripture = async (id) => {
  const result = await db.scriptures.get(id);
  return result ? result.data : null;
};

export const saveNote = async (id, content) => {
  return await db.notes.put({ id, content });
};

export const getNotes = async () => {
  const allNotes = await db.notes.toArray();
  return allNotes.reduce((acc, note) => {
    acc[note.id] = note.content;
    return acc;
  }, {});
};

export const saveHistory = async (item) => {
  const existing = await db.history
    .where({ book: item.book, chapter: item.chapter })
    .first();
  if (existing) await db.history.delete(existing.id);
  return await db.history.add({ ...item, timestamp: Date.now() });
};

export const getHistory = async (limit = 20) => {
  return await db.history.orderBy('timestamp').reverse().limit(limit).toArray();
};

export const toggleBookmark = async (item) => {
  const id = `${item.book}_${item.chapter}_${item.verse}`;
  const existing = await db.bookmarks.get(id);
  if (existing) {
    await db.bookmarks.delete(id);
    return false;
  } else {
    await db.bookmarks.put({ id, ...item });
    return true;
  }
};

export const getBookmarks = async () => {
  return await db.bookmarks.toArray();
};

// Highlighting Helpers
export const saveHighlight = async (id, color) => {
  if (!color) {
    await db.highlights.delete(id);
  } else {
    await db.highlights.put({ id, color });
  }
};

export const getHighlights = async () => {
  const all = await db.highlights.toArray();
  return all.reduce((acc, h) => {
    acc[h.id] = h.color;
    return acc;
  }, {});
};
