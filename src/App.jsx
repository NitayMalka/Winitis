import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ColorStep from './components/TastingForm/ColorStep';
import NoseStep from './components/TastingForm/NoseStep';
import ConclusionStep from './components/TastingForm/ConclusionStep';
import VerdictStep from './components/TastingForm/VerdictStep';
import NotesList from './components/SavedNotes/NotesList';
import ShareModal from './components/ShareModal';
import VerdictModal from './components/SavedNotes/VerdictModal';
import QuickReferenceModal from './components/QuickReferenceModal';
import { 
  getSavedNotes, 
  saveNote, 
  deleteNote, 
  getActiveStep, 
  saveActiveStep, 
  getActiveView, 
  saveActiveView, 
  getActiveDraftNote, 
  saveActiveDraftNote, 
  clearActiveDraftNote 
} from './utils/storage';
import { Wine, Check, Sparkles, Eye, Wind, Award, FileText } from 'lucide-react';
import { useTexts } from './context/TextContext';
import EditableText from './components/TextEditor/EditableText';
import { subscribeLiveSync } from './utils/liveSync';

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
    rimVariation: 'Ruby Edge'
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
  const [currentView, setCurrentView] = useState(() => getActiveView());
  const [currentStep, setCurrentStep] = useState(() => getActiveStep());
  const [wineNote, setWineNote] = useState(() => getActiveDraftNote(INITIAL_NOTE_STATE));
  const [savedNotes, setSavedNotes] = useState([]);
  const [shareNoteTarget, setShareNoteTarget] = useState(null);
  const [viewVerdictTarget, setViewVerdictTarget] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    const loaded = getSavedNotes();
    setSavedNotes(loaded);
  }, []);

  // Live Sync with PC during editing mode (deprecatable after editing)
  useEffect(() => {
    const unsubscribe = subscribeLiveSync((syncData) => {
      if (syncData.step) {
        setCurrentView('form');
        setCurrentStep(syncData.step);
      }
      if (syncData.wineNote) {
        setWineNote(prev => ({
          ...prev,
          ...syncData.wineNote
        }));
      }
    });
    return unsubscribe;
  }, []);

  // Persist current active step across app switches and browser sessions
  useEffect(() => {
    saveActiveStep(currentStep);
  }, [currentStep]);

  // Persist current view across app switches
  useEffect(() => {
    saveActiveView(currentView);
  }, [currentView]);

  // Persist active in-progress note draft
  useEffect(() => {
    saveActiveDraftNote(wineNote);
  }, [wineNote]);

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
    clearActiveDraftNote();
  };

  const handleDeleteNote = (id) => {
    if (window.confirm('Are you sure you want to delete this tasting note?')) {
      const updated = deleteNote(id);
      setSavedNotes(updated);
    }
  };

  const handleStartNewTasting = () => {
    clearActiveDraftNote();
    setWineNote(INITIAL_NOTE_STATE);
    setCurrentStep(1);
    setCurrentView('new');
    saveActiveStep(1);
    saveActiveView('new');
  };

  const { t } = useTexts();

  const steps = [
    { num: 1, label: t('navigation.step1', 'Color'), key: 'navigation.step1', icon: Eye },
    { num: 2, label: t('navigation.step2', 'Nose'), key: 'navigation.step2', icon: Wind },
    { num: 3, label: t('navigation.step3', 'Rating'), key: 'navigation.step3', icon: Award },
    { num: 4, label: t('navigation.step4', 'Summary'), key: 'navigation.step4', icon: FileText }
  ];

  return (
    <div className="app-container">
      <div className="sticky-nav-wrapper">
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
        )}
      </div>

      {currentView === 'new' && (
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
                palateData={wineNote.palate}
                updatePalateData={handleUpdatePalate}
              />
            )}

            {currentStep === 3 && (
              <ConclusionStep 
                wineInfo={wineNote}
                updateWineInfo={handleUpdateWineInfo}
                conclusionData={wineNote.conclusion} 
                updateConclusionData={handleUpdateConclusion}
              />
            )}

            {currentStep === 4 && (
              <VerdictStep 
                wineNote={wineNote} 
                updateWineNote={setWineNote}
                onSave={handleSaveCurrentNote}
                onShare={() => setShareNoteTarget(wineNote)}
              />
            )}

          </main>
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


    </div>
  );
}
