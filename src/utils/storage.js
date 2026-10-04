import { SAMPLE_NOTES } from '../data/wineData';

const STORAGE_KEY = 'winitis_tasting_notes';
const ACTIVE_STEP_KEY = 'winitis_active_step';
const ACTIVE_DRAFT_KEY = 'winitis_active_draft_note';
const ACTIVE_VIEW_KEY = 'winitis_active_view';
const ACTIVE_THEME_KEY = 'winitis_theme';

export const getActiveTheme = () => {
  try {
    const val = localStorage.getItem(ACTIVE_THEME_KEY);
    if (val === 'dark' || val === 'parchment') return val;
  } catch (e) {}
  return 'dark';
};

export const saveActiveTheme = (theme) => {
  try {
    localStorage.setItem(ACTIVE_THEME_KEY, theme);
  } catch (e) {}
};

export const getActiveStep = () => {
  try {
    const val = localStorage.getItem(ACTIVE_STEP_KEY);
    const num = parseInt(val, 10);
    if (num >= 1 && num <= 4) return num;
  } catch (e) {}
  return 1;
};

export const saveActiveStep = (step) => {
  try {
    localStorage.setItem(ACTIVE_STEP_KEY, String(step));
  } catch (e) {}
};

export const getActiveView = () => {
  try {
    const val = localStorage.getItem(ACTIVE_VIEW_KEY);
    if (val === 'saved' || val === 'new') return val;
  } catch (e) {}
  return 'new';
};

export const saveActiveView = (view) => {
  try {
    localStorage.setItem(ACTIVE_VIEW_KEY, view);
  } catch (e) {}
};

export const getActiveDraftNote = (initialState) => {
  try {
    const data = localStorage.getItem(ACTIVE_DRAFT_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return { ...initialState, ...parsed };
      }
    }
  } catch (e) {}
  return initialState;
};

export const saveActiveDraftNote = (note) => {
  try {
    localStorage.setItem(ACTIVE_DRAFT_KEY, JSON.stringify(note));
  } catch (e) {}
};

export const clearActiveDraftNote = () => {
  try {
    localStorage.removeItem(ACTIVE_DRAFT_KEY);
    localStorage.setItem(ACTIVE_STEP_KEY, '1');
  } catch (e) {}
};

export const getSavedNotes = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Seed initial samples if empty
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_NOTES));
      return SAMPLE_NOTES;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading notes from localStorage', err);
    return SAMPLE_NOTES;
  }
};

export const saveNote = (note) => {
  const notes = getSavedNotes();
  const existingIndex = notes.findIndex(n => n.id === note.id);
  
  let updatedNotes;
  if (existingIndex >= 0) {
    updatedNotes = [...notes];
    updatedNotes[existingIndex] = { ...note, updatedAt: new Date().toISOString() };
  } else {
    const newNote = {
      ...note,
      id: note.id || 'note_' + Date.now(),
      date: note.date || new Date().toISOString().split('T')[0]
    };
    updatedNotes = [newNote, ...notes];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
  } catch (err) {
    console.warn('LocalStorage quota exceeded. Attempting to save note without high-res photo...', err);
    try {
      // Graceful fallback: remove bottleImage from the current note if it was taking too much space
      const fallbackNotes = updatedNotes.map(n => (n.id === (note.id || newNote?.id) ? { ...n, bottleImage: null, useGenericBottle: true } : n));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackNotes));
    } catch (fallbackErr) {
      console.error('Critical storage quota exceeded', fallbackErr);
    }
  }
  return updatedNotes;
};

export const deleteNote = (id) => {
  const notes = getSavedNotes();
  const updated = notes.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const exportNotesJSON = () => {
  const notes = getSavedNotes();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `winitis_wine_notes_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
