/**
 * Resume Match AI
 * An intelligent resume tailoring and ATS optimization dashboard powered by Gemini.
 * Redesigned with a dynamic-color glassmorphism theme, Bento-grid results dashboard,
 * cover letter generator, keyword highlighter, and live re-score loop.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Send,
  Sliders,
  Highlighter,
  Layers,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import {
  auth,
  onAuthStateChanged,
  signOut,
  db,
  doc,
  setDoc,
  getDoc,
  updateProfile,
  collection,
  User,
} from './lib/firebase';
import {
  AnalysisResult,
  UploadedFileInfo,
  AtsSimulationReport,
  UserHistoryItem,
  ThemePreset,
} from './types';
import { SAMPLE_RESUME, SAMPLE_JOB_DESCRIPTION } from './sampleData';
import { LiquidBackground, LiquidRendererMode, LiquidIntensityLevel } from './components/LiquidBackground';
import { GlassNavbar } from './components/GlassNavbar';
import { GlassInputPanels } from './components/GlassInputPanels';
import { GlassLoadingCard } from './components/GlassLoadingCard';
import { GlassHeroScoreCard } from './components/GlassHeroScoreCard';
import { GlassScoreBreakdownCard } from './components/GlassScoreBreakdownCard';
import { GlassSkillsCards } from './components/GlassSkillsCards';
import { GlassBulletRewritesCard } from './components/GlassBulletRewritesCard';
import { GlassTopChangesCard } from './components/GlassTopChangesCard';
import { GlassChecklistCard } from './components/GlassChecklistCard';
import { GlassKeywordHighlighter } from './components/GlassKeywordHighlighter';
import { GlassEditableResumePanel } from './components/GlassEditableResumePanel';
import { GlassCoverLetterModal } from './components/GlassCoverLetterModal';
import { SkillGapRadarChart } from './components/SkillGapRadarChart';
import { AtsSimulationCard } from './components/AtsSimulationCard';
import { LinkedInOptimizerCard } from './components/LinkedInOptimizerCard';
import { ResumeBuilderView } from './components/ResumeBuilderView';
import { DeepAnalysisCards } from './components/DeepAnalysisCards';
import { FullReportView } from './components/FullReportView';
import { AuthModal } from './components/AuthModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { getActiveTheme } from './lib/themeSystem';

export default function App() {
  // Theme & Appearance State
  const [themePreset, setThemePreset] = useState<ThemePreset>('auto');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [backgroundMode, setBackgroundMode] = useState<LiquidRendererMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('resume_match_bg_mode');
      if (stored === 'webgl' || stored === 'svg') {
        return stored as LiquidRendererMode;
      }
    }
    return 'webgl';
  });
  const [isBackgroundPaused, setIsBackgroundPaused] = useState<boolean>(false);
  const [liquidIntensity, setLiquidIntensity] = useState<LiquidIntensityLevel>('normal');

  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);

  // Input states
  const [resumeMode, setResumeMode] = useState<'upload' | 'text'>('upload');
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);

  // Analysis & Status states
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSimulatingAts, setIsSimulatingAts] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [deltaScore, setDeltaScore] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // In-memory history for last 5 analyses
  const [memoryHistory, setMemoryHistory] = useState<UserHistoryItem[]>([]);

  // Top-level navigation: 'dashboard' | 'builder'
  const [activeView, setActiveView] = useState<'dashboard' | 'builder'>('dashboard');

  // Active result tab: 'all' | 'builder' | 'full_report' | 'deep_engine' | 'studio' | 'scanner' | 'rewrites' | 'ats_sim' | 'linkedin'
  const [activeTab, setActiveTab] = useState<
    'all' | 'builder' | 'full_report' | 'deep_engine' | 'studio' | 'scanner' | 'rewrites' | 'ats_sim' | 'linkedin'
  >('all');

  // Monitor auth status and synchronize user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.displayName) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().displayName) {
            await updateProfile(user, { displayName: userDoc.data().displayName });
            await user.reload();
            setCurrentUser(auth.currentUser || user);
            return;
          }
        } catch (syncErr) {
          console.warn('Could not read user profile from Firestore:', syncErr);
        }
      }
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Compute active theme configuration dynamically based on match score
  const activeThemeConfig = useMemo(() => {
    return getActiveTheme(themePreset, analysisResult ? analysisResult.match_score : null);
  }, [themePreset, analysisResult]);

  // Synchronize CSS custom properties on document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', activeThemeConfig.accent);
    root.style.setProperty('--accent-2', activeThemeConfig.accent2);
    root.style.setProperty('--glow', activeThemeConfig.glow);
    root.style.setProperty('--blob-1', activeThemeConfig.blob1);
    root.style.setProperty('--blob-2', activeThemeConfig.blob2);
    root.style.setProperty('--blob-3', activeThemeConfig.blob3);
    root.style.setProperty('--water-border', `color-mix(in srgb, ${activeThemeConfig.accent} 25%, rgba(255, 255, 255, 0.18))`);
    root.style.setProperty('--bg-base', 'transparent');
  }, [activeThemeConfig, isDark]);

  // Handle file extraction
  const handleFileExtracted = (fileInfo: UploadedFileInfo) => {
    setUploadedFile(fileInfo);
    setResumeText(fileInfo.extractedText);
    setErrorMessage(null);
  };

  const handleFileRemoved = () => {
    setUploadedFile(null);
    setResumeText('');
  };

  // 1-Click Sample dataset
  const handleLoadSample = () => {
    setResumeMode('text');
    setResumeText(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    setUploadedFile(null);
    setErrorMessage(null);
  };

  // Helper to persist analysis report to Firestore if user is authenticated
  const saveAnalysisToFirestore = async (
    user: User,
    result: AnalysisResult,
    jobTitle: string
  ) => {
    try {
      const docId = `analysis_${Date.now()}`;
      const docRef = doc(db, 'users', user.uid, 'analyses', docId);
      await setDoc(docRef, {
        id: docId,
        createdAt: new Date().toISOString(),
        jobTitle: result.job_title_guess || jobTitle || 'Target Role',
        matchScore: result.match_score,
        scoreExplanation: result.score_explanation,
        scoreBreakdown: result.score_breakdown || null,
        matchingSkills: result.matching_skills || [],
        missingKeywords: result.missing_keywords || [],
        bulletsToRewrite: result.bullets_to_rewrite || [],
        top5Changes: result.top_5_changes || [],
        preApplyChecklist: result.pre_apply_checklist || [],
        tailoredResumeText: result.tailored_resume_text || '',
        atsSimulation: result.ats_simulation || null,
      });
      setSavedSuccessMsg('Analysis report automatically synced to your cloud account.');
      setTimeout(() => setSavedSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to auto-save to Firestore:', err);
    }
  };

  // Run ATS Parser simulation call
  const runAtsSimulation = async (
    tailoredText: string,
    cleanJob: string,
    currentResult: AnalysisResult
  ) => {
    setIsSimulatingAts(true);
    try {
      const simRes = await fetch('/api/simulate-ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tailoredResumeText: tailoredText,
          jobDescription: cleanJob,
        }),
      });

      const simJson = await simRes.json();
      if (simRes.ok && simJson.success && simJson.report) {
        const updatedResult: AnalysisResult = {
          ...currentResult,
          ats_simulation: simJson.report,
        };
        setAnalysisResult(updatedResult);

        // Update in-memory item
        setMemoryHistory((prev) =>
          prev.map((item, idx) =>
            idx === 0 ? { ...item, atsSimulation: simJson.report } : item
          )
        );

        if (currentUser) {
          const firstLine = cleanJob.split('\n')[0] || 'Target Role';
          saveAnalysisToFirestore(currentUser, updatedResult, firstLine.slice(0, 60));
        }
      }
    } catch (simErr) {
      console.warn('ATS simulation background fetch encountered issue:', simErr);
    } finally {
      setIsSimulatingAts(false);
    }
  };

  // Primary Resume Analysis Call
  const handleAnalyze = async () => {
    const cleanResume = resumeText.trim();
    const cleanJob = jobDescription.trim();

    if (!cleanResume) {
      setErrorMessage('Please provide your resume by uploading a file or pasting text.');
      return;
    }

    if (!cleanJob) {
      setErrorMessage('Please paste the target job description to analyze alignment.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setSavedSuccessMsg(null);
    setDeltaScore(null);

    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: cleanResume,
          jobDescription: cleanJob,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to complete resume analysis.');
      }

      if (!json.data) {
        throw new Error('Analysis response missing data payload.');
      }

      const result: AnalysisResult = json.data;
      setAnalysisResult(result);

      // Save to memory history (last 5)
      const targetTitle = result.job_title_guess || cleanJob.split('\n')[0].slice(0, 45) || 'Target Role';
      const historyItem: UserHistoryItem = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        jobTitle: targetTitle,
        matchScore: result.match_score,
        scoreExplanation: result.score_explanation,
        scoreBreakdown: result.score_breakdown,
        matchingSkills: result.matching_skills,
        missingKeywords: result.missing_keywords,
        bulletsToRewrite: result.bullets_to_rewrite,
        top5Changes: result.top_5_changes,
        preApplyChecklist: result.pre_apply_checklist,
        tailoredResumeText: result.tailored_resume_text,
        atsSimulation: result.ats_simulation,
      };

      setMemoryHistory((prev) => [historyItem, ...prev.slice(0, 4)]);

      // Auto-save to user account if logged in
      if (currentUser) {
        saveAnalysisToFirestore(currentUser, result, targetTitle);
      }

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);

      // Run ATS simulation immediately
      runAtsSimulation(result.tailored_resume_text, cleanJob, result);
    } catch (err: any) {
      console.error('Resume analysis error:', err);
      setErrorMessage(
        err.message ||
          'An unexpected error occurred during ATS recruitment analysis. Please check your inputs and try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Re-score Loop (triggered from editable tailored resume panel)
  const handleReanalyze = async (updatedResumeText: string) => {
    if (!updatedResumeText.trim() || !jobDescription.trim()) return;
    setIsReanalyzing(true);
    setResumeText(updatedResumeText);
    const oldScore = analysisResult ? analysisResult.match_score : null;

    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: updatedResumeText.trim(),
          jobDescription: jobDescription.trim(),
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.data) {
        throw new Error(json.error || 'Failed to re-evaluate updated resume text.');
      }

      const newResult: AnalysisResult = json.data;
      if (oldScore !== null) {
        setDeltaScore(newResult.match_score - oldScore);
      }
      setAnalysisResult(newResult);

      const targetTitle = newResult.job_title_guess || jobDescription.split('\n')[0].slice(0, 45) || 'Target Role';
      const historyItem: UserHistoryItem = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        jobTitle: `${targetTitle} (Re-scored)`,
        matchScore: newResult.match_score,
        scoreExplanation: newResult.score_explanation,
        scoreBreakdown: newResult.score_breakdown,
        matchingSkills: newResult.matching_skills,
        missingKeywords: newResult.missing_keywords,
        bulletsToRewrite: newResult.bullets_to_rewrite,
        top5Changes: newResult.top_5_changes,
        preApplyChecklist: newResult.pre_apply_checklist,
        tailoredResumeText: newResult.tailored_resume_text,
        atsSimulation: newResult.ats_simulation,
      };

      setMemoryHistory((prev) => [historyItem, ...prev.slice(0, 4)]);

      if (currentUser) {
        saveAnalysisToFirestore(currentUser, newResult, targetTitle);
      }

      // Smooth scroll up to score
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Re-score error:', err);
      setErrorMessage(err?.message || 'Error re-evaluating resume.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Load selected analysis from history
  const handleSelectHistoryItem = (item: UserHistoryItem) => {
    setAnalysisResult({
      match_score: item.matchScore,
      score_explanation: item.scoreExplanation,
      score_breakdown: item.scoreBreakdown,
      matching_skills: item.matchingSkills,
      missing_keywords: item.missingKeywords,
      bullets_to_rewrite: item.bulletsToRewrite,
      top_5_changes: item.top5Changes,
      pre_apply_checklist: item.preApplyChecklist,
      tailored_resume_text: item.tailoredResumeText,
      ats_simulation: item.atsSimulation,
    });
    setResumeText(item.tailoredResumeText);
    setResumeMode('text');
    setDeltaScore(null);
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  // Quick save and download for Ctrl+S shortcut
  const handleQuickSaveAndDownload = () => {
    if (!analysisResult) return;
    const element = document.createElement('a');
    const file = new Blob([analysisResult.tailored_resume_text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `tailored_resume_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);

    setSavedSuccessMsg('Tailored resume downloaded (.txt) via Ctrl+S shortcut!');
    setTimeout(() => setSavedSuccessMsg(null), 3500);

    if (currentUser) {
      const firstLine = analysisResult.tailored_resume_text.split('\n')[0] || 'Resume';
      saveAnalysisToFirestore(currentUser, analysisResult, firstLine.slice(0, 60));
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      const isMod = isMac ? e.metaKey : e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      // 1. Esc: close any modal
      if (e.key === 'Escape') {
        setIsShortcutsModalOpen(false);
        setIsAuthModalOpen(false);
        setIsHistoryDrawerOpen(false);
        setIsCoverLetterOpen(false);
        return;
      }

      // 2. Ctrl+Enter: Trigger analysis
      if (isMod && e.key === 'Enter') {
        e.preventDefault();
        if (!isAnalyzing && resumeText.trim() && jobDescription.trim()) {
          handleAnalyze();
        } else if (!resumeText.trim() || !jobDescription.trim()) {
          setErrorMessage('Please provide both resume text and a job description to analyze.');
        }
        return;
      }

      // 3. Ctrl+S: Quick download and save
      if (isMod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (analysisResult) {
          handleQuickSaveAndDownload();
        } else {
          setSavedSuccessMsg('Please run the resume analysis first before downloading/saving.');
          setTimeout(() => setSavedSuccessMsg(null), 3000);
        }
        return;
      }

      // 4. Ctrl+Shift+L: Switch to LinkedIn tab
      if (isMod && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        if (analysisResult) {
          setActiveTab('linkedin');
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      // 5. Ctrl+Shift+D: Load sample data
      if (isMod && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        handleLoadSample();
        return;
      }

      // 6. Ctrl+K or Cmd+K: Open keyboard shortcuts cheat sheet
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 7. Standalone '?' when NOT typing
      if (e.key === '?' && !isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnalyzing, resumeText, jobDescription, analysisResult, currentUser]);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans relative selection:bg-indigo-500 selection:text-white bg-transparent">
      {/* 1. Full-Screen Dynamic Glossy Liquid Background: position: fixed; inset: 0; z-index: 0 */}
      <LiquidBackground
        isPaused={isBackgroundPaused}
        colors={activeThemeConfig}
        isDark={isDark}
        isAnalyzing={isAnalyzing || isReanalyzing}
        hasAnalyzed={Boolean(analysisResult)}
        matchScore={analysisResult ? analysisResult.match_score : null}
        themePreset={themePreset}
        intensity={liquidIntensity}
        mode={backgroundMode === 'svg' ? 'svg' : 'webgl'}
        onModeChange={(m) => {
          setBackgroundMode(m);
          sessionStorage.setItem('resume_match_bg_mode', m);
        }}
      />

      {/* 2. All App Content in wrapper at z-index: 10 */}
      <div
        className="relative z-10 flex flex-col min-h-screen bg-transparent"
        style={{ zIndex: 10, backgroundColor: 'transparent' }}
      >
        {/* Sticky Glass Navbar */}
        <GlassNavbar
          currentTheme={themePreset}
          activeThemeConfig={activeThemeConfig}
          onSelectTheme={setThemePreset}
          fluidIntensity={liquidIntensity}
          onSelectFluidIntensity={setLiquidIntensity}
          backgroundMode={backgroundMode}
          onSelectBackgroundMode={(m) => {
            setBackgroundMode(m);
            sessionStorage.setItem('resume_match_bg_mode', m);
          }}
          isBackgroundPaused={isBackgroundPaused}
          onToggleBackgroundPause={() => setIsBackgroundPaused((prev) => !prev)}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onOpenHistory={() => setIsHistoryDrawerOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
          user={currentUser}
          activeView={activeView}
          onViewChange={setActiveView}
        />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-10">
        {activeView === 'builder' ? (
          <ResumeBuilderView
            initialResumeText={analysisResult?.tailored_resume_text || resumeText}
            jobDescription={jobDescription}
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        ) : (
          <>
            {/* Input Panels Section */}
            <GlassInputPanels
              resumeMode={resumeMode}
              setResumeMode={setResumeMode}
              resumeText={resumeText}
              setResumeText={setResumeText}
              uploadedFile={uploadedFile}
              onFileExtracted={handleFileExtracted}
              onFileRemoved={handleFileRemoved}
              isExtractingFile={isExtractingFile}
              setIsExtractingFile={setIsExtractingFile}
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              onLoadSample={handleLoadSample}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              onError={setErrorMessage}
            />

            {/* Success message banner */}
            {savedSuccessMsg && (
              <div className="glass-panel p-4 bg-emerald-500/15 border-emerald-500/30 text-emerald-200 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {savedSuccessMsg}
                </span>
                <button
                  onClick={() => setIsHistoryDrawerOpen(true)}
                  className="text-emerald-300 font-bold underline cursor-pointer"
                >
                  Open History &rarr;
                </button>
              </div>
            )}

            {/* Error Alert Box */}
            {errorMessage && (
              <div className="glass-panel p-5 bg-rose-500/15 border-rose-500/30 text-rose-200 flex items-start gap-3.5 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">Analysis Error</h4>
                  <p className="text-xs text-rose-200 mt-1 leading-relaxed">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-xs font-bold text-rose-300 hover:text-white px-2 py-1 rounded bg-rose-500/20 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Glass Loading Card with rotating status messages */}
            {isAnalyzing && <GlassLoadingCard />}

            {/* 3. RESULTS DASHBOARD (Bento Grid of Glass Cards) */}
            {analysisResult && !isAnalyzing && (
              <section id="results-section" className="space-y-8 pt-2 animate-fade-slide-up">
                {/* Results Filter & Navigation Controls */}
                <div className="glass-panel p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/90 uppercase tracking-wider pl-1">
                      View Mode:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: 'all', label: 'Bento Overview' },
                        { id: 'deep_engine', label: 'Deep ATS Audit (10-Checks)' },
                        { id: 'full_report', label: 'Full Report & PDF' },
                        { id: 'builder', label: 'Resume Builder' },
                        { id: 'studio', label: 'Tailored Resume' },
                        { id: 'scanner', label: 'JD Keyword Map' },
                        { id: 'rewrites', label: 'Bullet Rewrites' },
                        { id: 'ats_sim', label: 'ATS Simulator' },
                        { id: 'linkedin', label: 'LinkedIn Format' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            if (tab.id === 'builder') {
                              setActiveView('builder');
                            } else {
                              setActiveTab(tab.id as any);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === tab.id
                              ? 'bg-white text-slate-900 shadow-md'
                              : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Header CTA Buttons: Builder + Cover Letter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveView('builder')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border border-white/20 bg-gradient-to-r from-cyan-500/80 to-indigo-600/80 hover:from-cyan-500 hover:to-indigo-600"
                    >
                      <Sliders className="w-3.5 h-3.5 text-cyan-200" />
                      <span>Resume Builder</span>
                    </button>
                    <button
                      onClick={() => setIsCoverLetterOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                        boxShadow: '0 0 15px var(--glow)',
                      }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Generate Cover Letter</span>
                    </button>
                  </div>
                </div>

            {/* TAB: BENTO OVERVIEW */}
            {activeTab === 'all' && (
              <div className="space-y-8">
                {/* Row 1: Hero Score Card + 5-Bar Breakdown Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-6 flex flex-col">
                    <GlassHeroScoreCard
                      score={analysisResult.match_score}
                      explanation={analysisResult.score_explanation}
                      deltaScore={deltaScore}
                    />
                  </div>
                  <div className="lg:col-span-6 flex flex-col">
                    <GlassScoreBreakdownCard
                      breakdown={analysisResult.score_breakdown}
                      matchScore={analysisResult.match_score}
                    />
                  </div>
                </div>

                {/* Row 2: Skill Gap & Alignment Radar Chart (Recharts) */}
                <SkillGapRadarChart
                  matchingSkills={analysisResult.matching_skills}
                  missingKeywords={analysisResult.missing_keywords}
                  matchScore={analysisResult.match_score}
                />

                {/* Row 3: Matching Skills (Green chips) + Missing Keywords (Red/Amber chips with click-to-copy) */}
                <GlassSkillsCards
                  matchingSkills={analysisResult.matching_skills}
                  missingKeywords={analysisResult.missing_keywords}
                  missingKeywordsWithPriority={analysisResult.missing_keywords_with_priority}
                />

                {/* Row 4: Interactive Job Description Keyword Highlighter */}
                <GlassKeywordHighlighter
                  jobDescription={jobDescription}
                  matchingSkills={analysisResult.matching_skills}
                  missingKeywords={analysisResult.missing_keywords}
                />

                {/* Row 5: Top 5 Changes List */}
                <GlassTopChangesCard changes={analysisResult.top_5_changes} />

                {/* Row 6: Bullet Rewrites Card (Side-by-side Before/After, Copy, Reason, Diff toggle) */}
                <GlassBulletRewritesCard bullets={analysisResult.bullets_to_rewrite} />

                {/* Row 7: Pre-Apply Checklist with Dynamic Circular Progress Ring */}
                <GlassChecklistCard items={analysisResult.pre_apply_checklist} />

                {/* Row 8: Full Tailored Resume Studio with Re-score Loop */}
                <GlassEditableResumePanel
                  initialResumeText={analysisResult.tailored_resume_text}
                  jobDescription={jobDescription}
                  matchingSkills={analysisResult.matching_skills}
                  onReanalyze={handleReanalyze}
                  isReanalyzing={isReanalyzing}
                />

                {/* Row 9: ATS Parser Simulation Engine */}
                <AtsSimulationCard
                  report={analysisResult.ats_simulation}
                  isLoading={isSimulatingAts}
                  onRunSimulation={() =>
                    runAtsSimulation(
                      analysisResult.tailored_resume_text,
                      jobDescription,
                      analysisResult
                    )
                  }
                  tailoredResumeText={analysisResult.tailored_resume_text}
                />

                {/* Row 10: Deep Analysis 10-Check Engine Bento Card */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>10-Point Deep ATS & Recruiter Quality Audit</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Exhaustive ATS formatting checks, keyword density map, weak verbs, metrics, red flags, and skill roadmap
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('deep_engine')}
                      className="text-xs font-bold text-cyan-300 hover:text-white underline cursor-pointer"
                    >
                      Focus View &rarr;
                    </button>
                  </div>
                  <DeepAnalysisCards
                    analysisResult={analysisResult}
                    onOpenBuilder={() => setActiveView('builder')}
                  />
                </div>
              </div>
            )}

            {/* TAB: DEEP ATS AUDIT (10 CHECKS) */}
            {activeTab === 'deep_engine' && (
              <DeepAnalysisCards
                analysisResult={analysisResult}
                onOpenBuilder={() => setActiveView('builder')}
              />
            )}

            {/* TAB: FULL REPORT & PDF */}
            {activeTab === 'full_report' && (
              <FullReportView
                analysisResult={analysisResult}
                jobDescription={jobDescription}
                onOpenBuilder={() => setActiveView('builder')}
              />
            )}

            {/* TAB: TAILORED RESUME STUDIO */}
            {activeTab === 'studio' && (
              <GlassEditableResumePanel
                initialResumeText={analysisResult.tailored_resume_text}
                jobDescription={jobDescription}
                matchingSkills={analysisResult.matching_skills}
                onReanalyze={handleReanalyze}
                isReanalyzing={isReanalyzing}
              />
            )}

            {/* TAB: KEYWORD HIGHLIGHTER */}
            {activeTab === 'scanner' && (
              <div className="space-y-6">
                <GlassKeywordHighlighter
                  jobDescription={jobDescription}
                  matchingSkills={analysisResult.matching_skills}
                  missingKeywords={analysisResult.missing_keywords}
                />
                <GlassSkillsCards
                  matchingSkills={analysisResult.matching_skills}
                  missingKeywords={analysisResult.missing_keywords}
                  missingKeywordsWithPriority={analysisResult.missing_keywords_with_priority}
                />
              </div>
            )}

            {/* TAB: BULLET REWRITES */}
            {activeTab === 'rewrites' && (
              <GlassBulletRewritesCard bullets={analysisResult.bullets_to_rewrite} />
            )}

            {/* TAB: ATS SIMULATION */}
            {activeTab === 'ats_sim' && (
              <AtsSimulationCard
                report={analysisResult.ats_simulation}
                isLoading={isSimulatingAts}
                onRunSimulation={() =>
                  runAtsSimulation(
                    analysisResult.tailored_resume_text,
                    jobDescription,
                    analysisResult
                  )
                }
                tailoredResumeText={analysisResult.tailored_resume_text}
              />
            )}

            {/* TAB: LINKEDIN OPTIMIZER */}
            {activeTab === 'linkedin' && (
              <LinkedInOptimizerCard
                tailoredResumeText={analysisResult.tailored_resume_text}
                matchingSkills={analysisResult.matching_skills}
                missingKeywords={analysisResult.missing_keywords}
              />
            )}
          </section>
        )}
      </>
    )}
  </main>

      {/* 5. Modals & Drawers */}
      <GlassCoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        resumeText={analysisResult?.tailored_resume_text || resumeText}
        jobDescription={jobDescription}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
      />

      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        user={currentUser}
        memoryHistory={memoryHistory}
        onSelectAnalysis={handleSelectHistoryItem}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* 6. Footer (Required Exact Copy) */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md py-6 mt-16 text-center text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-300">
            Built with Gemini • Your resume is never stored
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Dynamic Glassmorphism</span>
            <span>•</span>
            <button
              onClick={() => setIsShortcutsModalOpen(true)}
              className="hover:text-white underline cursor-pointer"
            >
              Shortcuts (Ctrl+K)
            </button>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
