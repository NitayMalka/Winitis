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
  clearActiveDraftNote,
  getActiveTheme,
  saveActiveTheme
} from './utils/storage';
import { toBlob, toPng } from 'html-to-image';
import { Wine, Check, Sparkles, Eye, Wind, Award, FileText } from 'lucide-react';
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
    rimVariation: 'Ruby Edge'
  },
  nose: {
    intensity: 'Medium(+)',
    development: 'Youthful',
    aromas: [
      'Blackberry',
      'Blackcurrant (Cassis)',
      'Plum',
      'Dark Cherry',
      'Vanilla',
      'Cedar',
      'Cinnamon / Sweet Spice',
      'Oak',
      'Leather',
      'Tobacco'
    ]
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

  // Day / Night Theme State (Default: 'dark')
  const [theme, setTheme] = useState(getActiveTheme);
  const [isSharingPhoto, setIsSharingPhoto] = useState(false);
  const [isSharePhotoSuccess, setIsSharePhotoSuccess] = useState(false);

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'parchment' : 'dark';
      saveActiveTheme(next);
      return next;
    });
  };

  const handleSharePhoto = async () => {
    if (isSharingPhoto) return;
    setIsSharingPhoto(true);

    try {
      // If not currently showing a verdict card, switch to summary step
      if (!document.querySelector('.verdict-card')) {
        setCurrentView('new');
        setCurrentStep(4);
        saveActiveView('new');
        saveActiveStep(4);
        await new Promise((r) => setTimeout(r, 200));
      }

      await new Promise((r) => setTimeout(r, 80));
      const cardEl = document.querySelector('.verdict-card');
      if (!cardEl) throw new Error('Verdict card element not found');

      const blob = await toBlob(cardEl, {
        pixelRatio: 2,
        cacheBust: true,
        filter: (node) => !node.classList?.contains('no-print')
      });

      if (!blob) throw new Error('Failed to generate image');

      const targetNote = viewVerdictTarget || wineNote;
      const safeWineName = (targetNote?.wineName || 'wine').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeWineName}_verdict.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: targetNote?.wineName || 'Wine Tasting Verdict',
          text: `Wine Tasting Summary: ${targetNote?.wineName || ''} (${targetNote?.vintage || ''})`
        });
        setIsSharePhotoSuccess(true);
        setTimeout(() => setIsSharePhotoSuccess(false), 2500);
      } else {
        const dataUrl = await toPng(cardEl, { pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
        setIsSharePhotoSuccess(true);
        setTimeout(() => setIsSharePhotoSuccess(false), 2500);
      }
    } catch (err) {
      console.warn('Share photo failed, attempting fallback download:', err);
      const cardEl = document.querySelector('.verdict-card');
      if (cardEl) {
        try {
          const dataUrl = await toPng(cardEl, { pixelRatio: 2 });
          const targetNote = viewVerdictTarget || wineNote;
          const safeWineName = (targetNote?.wineName || 'wine').replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const fileName = `${safeWineName}_verdict.png`;
          const link = document.createElement('a');
          link.download = fileName;
          link.href = dataUrl;
          link.click();
          setIsSharePhotoSuccess(true);
          setTimeout(() => setIsSharePhotoSuccess(false), 2500);
        } catch (fallbackErr) {
          console.error('Fallback photo download failed:', fallbackErr);
        }
      }
    } finally {
      setIsSharingPhoto(false);
    }
  };

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
          onShare={handleSharePhoto}
          onPrint={() => window.print()}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isSharingPhoto={isSharingPhoto}
          isSharePhotoSuccess={isSharePhotoSuccess}
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
                onShare={handleSharePhoto}
                theme={theme}
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
          theme={theme}
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
