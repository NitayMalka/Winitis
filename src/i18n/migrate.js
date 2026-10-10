// One-time, non-destructive i18n migration.
// Notes already store canonical English values (= stable ids), so nothing is rewritten.
// We only snapshot the existing notes + draft verbatim, so the pre-i18n data can always be
// recovered, and mark the schema version. Legacy label variants are mapped to ids at read
// time (LEGACY_ALIASES in he.js); original values are kept as they are.
export const I18N_VERSION_KEY = 'winitis_i18n_v';
export const I18N_BACKUP_KEY = 'winitis_backup_pre_i18n_v1';

export function runI18nMigration() {
  try {
    if (localStorage.getItem(I18N_VERSION_KEY) === '1') return;
    if (localStorage.getItem(I18N_BACKUP_KEY) === null) {
      localStorage.setItem(I18N_BACKUP_KEY, JSON.stringify({
        createdAt: new Date().toISOString(),
        notes: localStorage.getItem('winitis_tasting_notes'),
        draft: localStorage.getItem('winitis_active_draft_note')
      }));
    }
    localStorage.setItem(I18N_VERSION_KEY, '1');
  } catch (e) {
    // Storage full or unavailable: skip the backup, never touch the notes.
    console.warn('i18n migration skipped:', e);
  }
}
