import React, { useState } from 'react';
import NoteCard from './NoteCard';
import { exportNotesJSON } from '../../utils/storage';
import { Search, Plus, Download, Wine, Sparkles } from 'lucide-react';
import EditableText from '../TextEditor/EditableText';
import { useTexts } from '../../context/TextContext';

export default function NotesList({ notes, onViewNote, onShareNote, onDeleteNote, onNewTasting }) {
  const { t } = useTexts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrapeFilter, setSelectedGrapeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (note.wineName || '').toLowerCase().includes(term) ||
      (note.country || '').toLowerCase().includes(term) ||
      (note.region || '').toLowerCase().includes(term) ||
      (note.grape || '').toLowerCase().includes(term);
    
    const matchesGrape = selectedGrapeFilter === 'All' || note.grape === selectedGrapeFilter;

    return matchesSearch && matchesGrape;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date || 0) - new Date(a.date || 0);
    if (sortBy === 'score') return (b.conclusion?.score || 0) - (a.conclusion?.score || 0);
    if (sortBy === 'vintage') return (b.vintage || 0) - (a.vintage || 0);
    return 0;
  });

  const uniqueGrapes = ['All', ...Array.from(new Set(notes.map(n => n.grape).filter(Boolean)))];

  return (
    <div>
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 className="heading-serif" style={{ fontSize: '1.8rem', color: 'var(--gold-light)' }}>
            <EditableText textKey="cellar.title" defaultText="Cellar Tasting Log" />
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <EditableText 
              textKey="cellar.subtitle" 
              defaultText={`${notes.length} saved red wine evaluations in local storage`} 
              interpolations={{ count: notes.length }} 
            />
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={exportNotesJSON} title="Backup as JSON">
            <Download size={16} /> <EditableText textKey="cellar.exportJsonBtn" defaultText="Export JSON" />
          </button>

          <button className="btn btn-primary" onClick={onNewTasting}>
            <Plus size={16} /> <EditableText textKey="cellar.newTastingBtn" defaultText="New Tasting" />
          </button>
        </div>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} color="#a395a8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '36px', width: '100%' }}
              placeholder={t('cellar.searchPlaceholder', 'Search wine, country, region, or grape...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <EditableText textKey="cellar.sortLabel" defaultText="Sort:" />
            </span>
            <select 
              className="form-select" 
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">{t('cellar.sortNewest', 'Newest First')}</option>
              <option value="score">{t('cellar.sortScore', 'Highest Rated')}</option>
              <option value="vintage">{t('cellar.sortVintage', 'Vintage Year')}</option>
            </select>
          </div>
        </div>

        {/* Grape Pills Filter */}
        {uniqueGrapes.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
            {uniqueGrapes.map(grape => (
              <button
                key={grape}
                className={`tag-pill ${selectedGrapeFilter === grape ? 'active' : ''}`}
                style={{ fontSize: '0.78rem', padding: '4px 12px' }}
                onClick={() => setSelectedGrapeFilter(grape)}
              >
                {grape}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Notes */}
      {filteredNotes.length > 0 ? (
        <div className="notes-grid">
          {filteredNotes.map(note => (
            <NoteCard 
              key={note.id} 
              note={note} 
              onView={onViewNote} 
              onShare={onShareNote}
              onDelete={onDeleteNote}
            />
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Wine size={48} color="#d4af37" style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3 className="font-serif" style={{ color: 'var(--gold-light)' }}>
            <EditableText textKey="cellar.emptyTitle" defaultText="No Tasting Notes Found" />
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
            {searchTerm ? (
              <EditableText textKey="cellar.emptySearchDesc" defaultText="No wines match your search query." />
            ) : (
              <EditableText textKey="cellar.emptyDefaultDesc" defaultText="Start your first red wine evaluation to populate your cellar log!" />
            )}
          </p>
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={onNewTasting}>
            <Plus size={16} /> <EditableText textKey="cellar.startEvaluationBtn" defaultText="Start Red Wine Evaluation" />
          </button>
        </div>
      )}
    </div>
  );
}
