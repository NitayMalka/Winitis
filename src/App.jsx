import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ColorStep from './components/TastingForm/ColorStep';
import NoseStep from './components/TastingForm/NoseStep';
import PalateStep from './components/TastingForm/PalateStep';
import ConclusionStep from './components/TastingForm/ConclusionStep';
import VerdictStep from './components/TastingForm/VerdictStep';
import NotesList from './components/SavedNotes/NotesList';
import ShareModal from './components/ShareModal';
import VerdictModal from './components/SavedNotes/VerdictModal';
import QuickReferenceModal from './components/QuickReferenceModal';
import { getSavedNotes, saveNote, deleteNote } from './utils/storage';
import { Wine, Check, Sparkles, Eye, Wind, Activity, Award, FileText } from 'lucide-react';
import { useTexts } from './context/TextContext';
import EditableText from './components/TextEditor/EditableText';

const INITIAL_NOTE_STATE = {
  wineName: '',
  vintage: new Date().getFullYear().toString(),
  grape: '',
  country: '',
  region: '',
  alcohol: '14.0%',
  bottleImage: null,
  useGenericBottle: true,
  vfm: 4,
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
    tanninTexture: 'Velvety',
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
  const [currentStep, setCurrentStep] = useState(1); // 1 to 6
  const [wineNote, setWineNote] = useState(INITIAL_NOTE_STATE);
  const [savedNotes, setSavedNotes] = useState([]);
  const [shareNoteTarget, setShareNoteTarget] = useState(null);
  const [viewVerdictTarget, setViewVerdictTarget] = useState(null);
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

  const { t } = useTexts();

  const steps = [
    { num: 1, label: t('navigation.step1', 'Color Inspector'), key: 'navigation.step1', icon: Eye },
    { num: 2, label: t('navigation.step2', 'Nose & Aromas'), key: 'navigation.step2', icon: Wind },
    { num: 3, label: t('navigation.step3', 'Palate & Structure'), key: 'navigation.step3', icon: Activity },
    { num: 4, label: t('navigation.step4', 'Rating & Notes'), key: 'navigation.step4', icon: Award },
    { num: 5, label: t('navigation.step5', 'Verdict Summary'), key: 'navigation.step5', icon: FileText }
  ];

  return (
    <div className="app-container">
      <Header 
        currentView={currentView}
        setCurrentView={setCurrentView}
        savedCount={savedNotes.length}
        onOpenGuide={() => setShowGuideModal(true)}
        onSave={handleSaveCurrentNote}
        onShare={() => setShareNoteTarget(wineNote)}
        onPrint={() => window.print()}
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
                  <EditableText textKey={s.key} defaultText={s.label} />
                </div>
              );
            })}
          </div>

          <main className="main-content">
            {currentStep === 1 && (
              <ColorStep 
                colorData={wineNote.color} 
                updateColorData={handleUpdateColor} 
              />
            )}

            {currentStep === 2 && (
              <NoseStep 
                noseData={wineNote.nose} 
                updateNoseData={handleUpdateNose} 
              />
            )}

            {currentStep === 3 && (
              <PalateStep 
                palateData={wineNote.palate} 
                updatePalateData={handleUpdatePalate} 
              />
            )}

            {currentStep === 4 && (
              <ConclusionStep 
                wineInfo={wineNote}
                updateWineInfo={handleUpdateWineInfo}
                conclusionData={wineNote.conclusion} 
                updateConclusionData={handleUpdateConclusion}
              />
            )}

            {currentStep === 5 && (
              <VerdictStep 
                wineNote={wineNote} 
                updateWineNote={setWineNote}
                onSave={handleSaveCurrentNote}
                onShare={() => setShareNoteTarget(wineNote)}
              />
            )}

          </main>
        </>
      )}

      {currentView === 'saved' && (
        <main className="main-content">
          <NotesList 
            notes={savedNotes}
            onViewNote={(note) => setViewVerdictTarget(note)}
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

      {/* Verdict Full Summary Modal */}
      {viewVerdictTarget && (
        <VerdictModal 
          note={viewVerdictTarget}
          onClose={() => setViewVerdictTarget(null)}
          onShare={(note) => {
            setViewVerdictTarget(null);
            setShareNoteTarget(note);
          }}
        />
      )}

      {/* Guide Modal */}
      {showGuideModal && (
        <QuickReferenceModal 
          onClose={() => setShowGuideModal(false)}
        />
      )}

      <footer className="app-footer">
        <div>
          <EditableText textKey="footer.line1" defaultText="Winitis Red Wine Tasting Companion • Sommelier Level Deductive Tasting PWA" />
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>
          <EditableText textKey="footer.line2" defaultText="Designed for Red Wines • Split-Screen Color Inspection • Offline Local Storage" />
        </div>
      </footer>
    </div>
  );
}
