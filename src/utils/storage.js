import { SAMPLE_NOTES } from '../data/wineData';

const STORAGE_KEY = 'winitis_tasting_notes';

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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
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
