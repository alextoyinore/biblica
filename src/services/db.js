import Dexie from 'dexie';

export const db = new Dexie('BiblicaDB');

// Schema v5: notes now store an 'entries' array for multi-note support per verse
db.version(5).stores({
  scriptures: 'id',
  commentaries: 'id',
  notes: 'id',      // book_chapter_verse → { id, entries: [{noteId, title, content, timestamp}] }
  history: '++id, book, chapter, timestamp',
  bookmarks: 'id',
  highlights: 'id',
  readingPlans: 'id',
  prayers: '++id, category, timestamp, isAnswered'
}).upgrade(tx => {
  // Migrate old single-note records { id, content, title, timestamp } → { id, entries: [...] }
  return tx.table('notes').toCollection().modify(record => {
    if (!record.entries) {
      record.entries = [{
        noteId: `${record.id}_0`,
        title: record.title || '',
        content: record.content || '',
        timestamp: record.timestamp || Date.now()
      }];
      delete record.content;
      delete record.title;
      delete record.timestamp;
    }
  });
});

// Keep older version chains so existing DBs can upgrade step by step
db.version(4).stores({
  scriptures: 'id',
  commentaries: 'id',
  notes: 'id',
  history: '++id, book, chapter, timestamp',
  bookmarks: 'id',
  highlights: 'id',
  readingPlans: 'id',
  prayers: '++id, category, timestamp, isAnswered'
});

// Helper functions
export const saveScripture = async (id, data) => {
  return await db.scriptures.put({ id, data });
};

export const getScripture = async (id) => {
  const result = await db.scriptures.get(id);
  return result ? result.data : null;
};

export const saveCommentary = async (id, data) => {
  return await db.commentaries.put({ id, data });
};

export const getCommentary = async (id) => {
  const result = await db.commentaries.get(id);
  return result ? result.data : null;
};

/**
 * Save (create or update) a single note entry within a verse.
 * @param {string} verseKey  e.g. "Genesis_1_1"
 * @param {string} noteId    unique id for this entry (e.g. "Genesis_1_1_<timestamp>")
 * @param {string} content   HTML content
 * @param {string} title     plain-text title
 */
export const saveNoteEntry = async (verseKey, noteId, content, title = '') => {
  const record = await db.notes.get(verseKey) || { id: verseKey, entries: [] };
  const idx = record.entries.findIndex(e => e.noteId === noteId);
  const entry = { noteId, title, content, timestamp: Date.now() };
  if (idx >= 0) {
    record.entries[idx] = entry;
  } else {
    record.entries.push(entry);
  }
  return await db.notes.put(record);
};

/**
 * Delete a single note entry. Removes the whole verse record if no entries remain.
 */
export const deleteNoteEntry = async (verseKey, noteId) => {
  const record = await db.notes.get(verseKey);
  if (!record) return;
  record.entries = record.entries.filter(e => e.noteId !== noteId);
  if (record.entries.length === 0) {
    return await db.notes.delete(verseKey);
  }
  return await db.notes.put(record);
};

/**
 * Returns all notes as { [verseKey]: [entry, ...] }
 */
export const getNotes = async () => {
  const allRecords = await db.notes.toArray();
  return allRecords.reduce((acc, record) => {
    acc[record.id] = record.entries || [];
    return acc;
  }, {});
};

// Keep legacy deleteNote for full verse deletion (used nowhere now but kept for safety)
export const deleteNote = async (id) => {
  return await db.notes.delete(id);
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

// Reading Plans Helpers
export const getReadingPlans = async () => {
  return await db.readingPlans.toArray();
};

export const updateReadingPlan = async (plan) => {
  return await db.readingPlans.put(plan);
};

// Prayers Helpers
export const getPrayers = async () => {
  return await db.prayers.orderBy('timestamp').reverse().toArray();
};

export const savePrayer = async (prayer) => {
  return await db.prayers.put({ ...prayer, timestamp: prayer.timestamp || Date.now() });
};

export const deletePrayer = async (id) => {
  return await db.prayers.delete(id);
};
