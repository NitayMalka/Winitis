import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WineInfoStep from './components/TastingForm/WineInfoStep';
import ColorStep from './components/TastingForm/ColorStep';
import NoseStep from './components/TastingForm/NoseStep';
import PalateStep from './components/TastingForm/PalateStep';
import ConclusionStep from './components/TastingForm/ConclusionStep';
import NotesList from './components/SavedNotes/NotesList';
import ShareModal from './components/ShareModal';
import QuickReferenceModal from './components/QuickReferenceModal';
import { getSavedNotes, saveNote, deleteNote } from './utils/storage';
import { Wine, ArrowRight, ArrowLeft, Check, Sparkles, Eye, Wind, Activity, Award } from 'lucide-react';

const INITIAL_NOTE_STATE = {
  wineName: '',
  vintage: new Date().getFullYear().toString(),
  grape: '',
  country: '',
  region: '',
  alcohol: '14.0%',
  color: {
    id: 'ruby',
    name: 'Ruby',
    hex: '#7e1022',
    intensity: 'Deep',
    clarity: 'Clear',
    rimVariation: 'Standard Ruby Rim'
  },
  nose: {
    intensity: 'Medium(+)',
    development: 'Youthful',
    aromas: ['Blackberry', 'Blackcurrant (Cassis)', 'Vanilla', 'Cedar']
  },
  palate: {
    sweetness: 'Dry',
    acidity: 'Medium(+)',
    tannin: 'Medium(+) (Grippy)',
    alcoholLevel: 'High (≥14%)',
    body: 'Full-Bodied',
    finish: 'Long (45s+)'
  },
  conclusion: {
    score: 93,
    price: '',
    quality: 'Very Good',
    drinkWindow: 'Can drink now, but has potential for aging (5-10+ years)',
    notes: ''
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState('new'); // 'new' | 'saved'
  const [currentStep, setCurrentStep] = useState(1); // 1 to 5
  const [wineNote, setWineNote] = useState(INITIAL_NOTE_STATE);
  const [savedNotes, setSavedNotes] = useState([]);
  const [shareNoteTarget, setShareNoteTarget] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    const loaded = getSavedNotes();
    setSavedNotes(loaded);
  }, []);

  const handleUpdateWineInfo = (info) => {
    setWineNote(prev => ({ ...prev, ...info }));
  };

  const handleUpdateColor = (colorData) => {
    setWineNote(prev => ({ ...prev, color: colorData }));
  };

  const handleUpdateNose = (noseData) => {
    setWineNote(prev => ({ ...prev, nose: noseData }));
  };

  const handleUpdatePalate = (palateData) => {
    setWineNote(prev => ({ ...prev, palate: palateData }));
  };

  const handleUpdateConclusion = (conclusionData) => {
    setWineNote(prev => ({ ...prev, conclusion: conclusionData }));
  };

  const handleSaveCurrentNote = () => {
    const updatedList = saveNote(wineNote);
    setSavedNotes(updatedList);
    setShareNoteTarget(wineNote);
  };

  const handleDeleteNote = (id) => {
    if (window.confirm('Are you sure you want to delete this tasting note?')) {
      const updated = deleteNote(id);
      setSavedNotes(updated);
    }
  };

  const handleStartNewTasting = () => {
    setWineNote(INITIAL_NOTE_STATE);
    setCurrentStep(1);
    setCurrentView('new');
  };

  const steps = [
    { num: 1, label: 'Identity', icon: Wine },
    { num: 2, label: 'Color Inspector', icon: Eye },
    { num: 3, label: 'Nose & Aromas', icon: Wind },
    { num: 4, label: 'Palate & Structure', icon: Activity },
    { num: 5, label: 'Rating & Save', icon: Award }
  ];

  return (
    <div className="app-container">
      <Header 
        currentView={currentView}
        setCurrentView={setCurrentView}
        savedCount={savedNotes.length}
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {currentView === 'new' && (
        <>
          {/* Step Progress Navigation Bar */}
          <div className="step-bar">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div 
                  key={s.num}
                  className={`step-item ${currentStep === s.num ? 'active' : ''} ${currentStep > s.num ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(s.num)}
                >
                  <div className="step-number">
                    {currentStep > s.num ? <Check size={12} /> : s.num}
                  </div>
                  <Icon size={14} />
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>

          <main className="main-content">
            {currentStep === 1 && (
              <WineInfoStep 
                wineInfo={wineNote} 
                updateWineInfo={handleUpdateWineInfo} 
              />
            )}

            {currentStep === 2 && (
              <ColorStep 
                colorData={wineNote.color} 
                updateColorData={handleUpdateColor} 
              />
            )}

            {currentStep === 3 && (
              <NoseStep 
                noseData={wineNote.nose} 
                updateNoseData={handleUpdateNose} 
              />
            )}

            {currentStep === 4 && (
              <PalateStep 
                palateData={wineNote.palate} 
                updatePalateData={handleUpdatePalate} 
              />
            )}

            {currentStep === 5 && (
              <ConclusionStep 
                conclusionData={wineNote.conclusion} 
                updateConclusionData={handleUpdateConclusion}
                onSave={handleSaveCurrentNote}
                onShare={() => setShareNoteTarget(wineNote)}
              />
            )}

            {/* Bottom Wizard Stepper Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <button 
                className="btn btn-outline"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
              >
                <ArrowLeft size={16} /> Previous
              </button>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Step {currentStep} of 5
              </span>

              {currentStep < 5 ? (
                <button 
                  className="btn btn-gold"
                  onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
                >
                  Next Step <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={handleSaveCurrentNote}
                >
                  Save & Complete <Check size={16} />
                </button>
              )}
            </div>
          </main>
        </>
      )}

      {currentView === 'saved' && (
        <main className="main-content">
          <NotesList 
            notes={savedNotes}
            onViewNote={(note) => setShareNoteTarget(note)}
            onShareNote={(note) => setShareNoteTarget(note)}
            onDeleteNote={handleDeleteNote}
            onNewTasting={handleStartNewTasting}
          />
        </main>
      )}

      {/* Share Modal */}
      {shareNoteTarget && (
        <ShareModal 
          note={shareNoteTarget}
          onClose={() => setShareNoteTarget(null)}
        />
      )}

      {/* Guide Modal */}
      {showGuideModal && (
        <QuickReferenceModal 
          onClose={() => setShowGuideModal(false)}
        />
      )}

      <footer className="app-footer">
        <div>Winitis Red Wine Tasting Companion • Sommelier Level Deductive Tasting PWA</div>
        <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>
          Designed for Red Wines • Split-Screen Color Inspection • Offline Local Storage
        </div>
      </footer>
    </div>
  );
}
