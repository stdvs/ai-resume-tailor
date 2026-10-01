import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ResumeBuilderData,
  BuilderTemplateId,
  BuilderFontFamily,
  ResumeVersion,
  ResumeExperienceItem,
  ResumeProjectItem,
  ResumeSkillCategory,
  ResumeEducationItem,
  ResumeCertificationItem,
  ResumeAchievementItem,
  ResumeLanguageItem,
} from '../types';
import { ResumeLivePreview } from './ResumeLivePreview';
import { AiBulletAssistantModal } from './AiBulletAssistantModal';
import { ResumeVersionCompareModal } from './ResumeVersionCompareModal';
import { AiSmartPopulateModal } from './AiSmartPopulateModal';
import { generateDocxBlob } from '../lib/docxExport';
import { generatePlainText, generateMarkdown } from '../lib/textExport';
import {
  Sparkles,
  Download,
  FileText,
  FileCode,
  Save,
  RotateCcw,
  RotateCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Eye,
  Check,
  AlertTriangle,
  Layers,
  Palette,
  Type,
  FileDown,
  Printer,
  Upload,
  Copy,
  GitCompare,
  Wand2,
  CheckCircle2,
  Clock,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Globe,
  Tag,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Loader2,
} from 'lucide-react';

interface ResumeBuilderViewProps {
  initialResumeText?: string;
  jobDescription?: string;
  onBackToDashboard?: () => void;
}

const DEFAULT_BUILDER_DATA: ResumeBuilderData = {
  contact: {
    fullName: 'Alex Chen',
    jobTitle: 'Senior Frontend Engineer',
    email: 'alex.chen.dev@example.com',
    phone: '+1 (555) 392-1084',
    location: 'San Francisco, CA',
    website: 'https://alexchen.dev',
    linkedin: 'linkedin.com/in/alexchen-dev',
    github: 'github.com/alexchen',
  },
  summary:
    'Results-driven Software Engineer with 4+ years of experience engineering high-performance web applications using React, TypeScript, and modern front-end tooling. Proven track record of improving Core Web Vitals by [add metric]%, architecting reusable component libraries, and collaborating across agile teams to accelerate release velocity.',
  skillCategories: [
    {
      id: 'cat_1',
      categoryName: 'Languages & Core',
      skills: ['JavaScript (ESNext)', 'TypeScript', 'HTML5', 'CSS3/SCSS', 'SQL'],
    },
    {
      id: 'cat_2',
      categoryName: 'Frameworks & Libraries',
      skills: ['React 19', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS', 'Redux Toolkit', 'Zustand'],
    },
    {
      id: 'cat_3',
      categoryName: 'Tools & Cloud',
      skills: ['Git', 'Vite', 'Webpack', 'Docker', 'Jest', 'Playwright', 'CI/CD (GitHub Actions)'],
    },
  ],
  experience: [
    {
      id: 'exp_1',
      role: 'Frontend Engineer',
      company: 'TechStream Solutions',
      location: 'San Francisco, CA',
      startDate: '03/2022',
      endDate: '',
      current: true,
      bullets: [
        'Architected and deployed customer dashboard micro-frontends in React and TypeScript, serving over [add metric] active users.',
        'Partnered with design leadership to establish a WCAG 2.1 AA accessible component system, reducing design-to-code turnaround by [add metric]%.',
        'Spearheaded performance optimization initiatives, slashing Largest Contentful Paint (LCP) from [add metric]s to [add metric]s.',
        'Migrated critical legacy JavaScript modules to strict TypeScript, eliminating recurring runtime exceptions.',
      ],
    },
    {
      id: 'exp_2',
      role: 'Junior Web Developer',
      company: 'CloudPeak Media',
      location: 'Oakland, CA',
      startDate: '08/2020',
      endDate: '02/2022',
      current: false,
      bullets: [
        'Developed dynamic, mobile-first client portals utilizing React, Bootstrap, and RESTful APIs.',
        'Automated regression testing workflows with Jest, boosting code test coverage by [add metric]%.',
        'Assisted senior architects in code audits and cross-browser compatibility testing across Tier-1 browsers.',
      ],
    },
  ],
  education: [
    {
      id: 'edu_1',
      degree: 'B.S.',
      field: 'Computer Science',
      school: 'University of California, Davis',
      location: 'Davis, CA',
      graduationDate: '06/2020',
      gpaOrHonors: 'Magna Cum Laude',
      bullets: [],
    },
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'Real-Time Pulse Analytics Engine',
      techStack: 'React, WebSockets, D3.js, Node.js',
      link: 'https://github.com/alexchen/pulse-engine',
      bullets: [
        'Engineered an event-driven telemetry dashboard visualizing streaming financial tickers with sub-50ms latency.',
        'Integrated custom WebGL data visualizers handling over 10,000 streaming data points at 60 FPS.',
      ],
    },
  ],
  certifications: [
    {
      id: 'cert_1',
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      date: '2023',
    },
  ],
  achievements: [
    {
      id: 'ach_1',
      title: 'Hackathon Grand Prize Winner',
      description: 'Built an open-source accessibility scanner selected 1st out of 45 engineering teams.',
      date: '2023',
    },
  ],
  languages: [
    { id: 'lang_1', language: 'English', proficiency: 'Native / Bilingual' },
    { id: 'lang_2', language: 'Mandarin', proficiency: 'Professional Working' },
  ],
  sectionOrder: [
    'summary',
    'skills',
    'experience',
    'projects',
    'education',
    'certifications',
    'achievements',
    'languages',
  ],
};

const TEMPLATE_CONFIGS: {
  id: BuilderTemplateId;
  name: string;
  badge: string;
  atsSafe: boolean;
  desc: string;
}[] = [
  {
    id: 'classic',
    name: 'Classic',
    badge: '✓ ATS-Safe (Single-Column)',
    atsSafe: true,
    desc: 'Timeless single-column typography with clean hairline dividers. Universal 100% ATS parser guarantee.',
  },
  {
    id: 'modern',
    name: 'Modern',
    badge: '✓ ATS-Safe (Single-Column)',
    atsSafe: true,
    desc: 'Contemporary color banner header, crisp skill tags, and refined spacing. Perfect for tech & product roles.',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    badge: '✓ ATS-Safe (Single-Column)',
    atsSafe: true,
    desc: 'Distraction-free monochrome layout prioritizing content readability and white space.',
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    badge: '⚠️ 2-Column (Visual)',
    atsSafe: false,
    desc: 'Eye-catching two-column layout. Great for human review/networking; may reduce legacy ATS parser accuracy.',
  },
  {
    id: 'compact',
    name: 'Compact',
    badge: '✓ ATS-Safe (1-Page Fit)',
    atsSafe: true,
    desc: 'Space-optimized dense single-column layout engineered to fit rich experience into a single page.',
  },
];

const ACCENT_PRESETS = [
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Slate', hex: '#334155' },
  { name: 'Violet', hex: '#8b5cf6' },
];

const FONT_PRESETS: { id: BuilderFontFamily; name: string; styleName: string }[] = [
  { id: 'inter', name: 'Inter', styleName: 'Modern Sans' },
  { id: 'roboto', name: 'Roboto', styleName: 'Clean Sans' },
  { id: 'merriweather', name: 'Merriweather', styleName: 'Editorial Serif' },
  { id: 'jetbrains', name: 'JetBrains Mono', styleName: 'Technical Mono' },
  { id: 'poppins', name: 'Poppins', styleName: 'Geometric Sans' },
];

export const ResumeBuilderView: React.FC<ResumeBuilderViewProps> = ({
  initialResumeText,
  jobDescription,
  onBackToDashboard,
}) => {
  // Core Builder State
  const [data, setData] = useState<ResumeBuilderData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('resume_builder_current_data');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_BUILDER_DATA;
  });

  const [selectedTemplate, setSelectedTemplate] = useState<BuilderTemplateId>('classic');
  const [accentColor, setAccentColor] = useState<string>('#4f46e5');
  const [fontFamily, setFontFamily] = useState<BuilderFontFamily>('inter');
  const [compactSpacing, setCompactSpacing] = useState<boolean>(false);

  // Undo / Redo Stacks
  const [history, setHistory] = useState<ResumeBuilderData[]>([DEFAULT_BUILDER_DATA]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isUndoRedoAction = useRef(false);

  // Versions State
  const [versions, setVersions] = useState<ResumeVersion[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('resume_builder_versions');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [
      {
        id: 'ver_default',
        name: 'Master Copy',
        updatedAt: new Date().toISOString(),
        data: DEFAULT_BUILDER_DATA,
        templateId: 'classic',
        accentColor: '#4f46e5',
        fontFamily: 'inter',
      },
    ];
  });
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Active Collapsible Accordion Sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    contact: true,
    summary: true,
    skills: true,
    experience: true,
    projects: false,
    education: true,
    certifications: false,
    achievements: false,
    languages: false,
  });

  // AI Assistant Modal State
  const [aiAssistantTarget, setAiAssistantTarget] = useState<{
    section: 'experience' | 'projects' | 'summary';
    itemId?: string;
    bulletIndex?: number;
    text: string;
    action?: 'improve' | 'add_action_verb' | 'shorten' | 'make_impactful' | 'tailor';
  } | null>(null);

  // AI Smart Populate State
  const [isSmartPopulateOpen, setIsSmartPopulateOpen] = useState(false);
  const [smartPopulateTarget, setSmartPopulateTarget] = useState<{
    type: 'experience' | 'project';
    id: string;
    title: string;
  } | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [isDraggingBullet, setIsDraggingBullet] = useState(false);

  // Listen to drag events dispatched from AiSmartPopulateModal
  useEffect(() => {
    const handleDragStart = () => setIsDraggingBullet(true);
    const handleDragEnd = () => {
      setIsDraggingBullet(false);
      setDragOverTargetId(null);
    };

    window.addEventListener('resume-bullet-drag-start', handleDragStart);
    window.addEventListener('resume-bullet-drag-end', handleDragEnd);
    return () => {
      window.removeEventListener('resume-bullet-drag-start', handleDragStart);
      window.removeEventListener('resume-bullet-drag-end', handleDragEnd);
    };
  }, []);

  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Summary generation loading
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('resume_builder_current_data', JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem('resume_builder_versions', JSON.stringify(versions));
    } catch {
      // ignore
    }
  }, [versions]);

  // Push to undo/redo history
  const updateDataWithHistory = useCallback((updater: (prev: ResumeBuilderData) => ResumeBuilderData) => {
    setData((prev) => {
      const next = updater(prev);
      if (!isUndoRedoAction.current) {
        setHistory((prevHist) => {
          const sliced = prevHist.slice(0, historyIndex + 1);
          return [...sliced, next];
        });
        setHistoryIndex((prevIdx) => prevIdx + 1);
      }
      isUndoRedoAction.current = false;
      return next;
    });
  }, [historyIndex]);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prevData = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setData(prevData);
    }
  }, [history, historyIndex]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextData = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setData(nextData);
    }
  }, [history, historyIndex]);

  // Insert bullet from AI Smart Populate (via Drag & Drop or 1-Click Insert)
  const handleInsertBullet = useCallback(
    (
      targetType: 'experience' | 'project' | 'summary',
      targetId: string,
      bulletText: string,
      insertAtIndex?: number
    ) => {
      if (!bulletText.trim()) return;
      updateDataWithHistory((prev) => {
        if (targetType === 'experience') {
          return {
            ...prev,
            experience: prev.experience.map((it) => {
              if (it.id === targetId) {
                const nextBullets = [...it.bullets];
                if (typeof insertAtIndex === 'number' && insertAtIndex >= 0 && insertAtIndex <= nextBullets.length) {
                  nextBullets.splice(insertAtIndex, 0, bulletText.trim());
                } else {
                  nextBullets.push(bulletText.trim());
                }
                return {
                  ...it,
                  bullets: nextBullets,
                };
              }
              return it;
            }),
          };
        } else if (targetType === 'project') {
          return {
            ...prev,
            projects: prev.projects.map((it) => {
              if (it.id === targetId) {
                const nextBullets = [...it.bullets];
                if (typeof insertAtIndex === 'number' && insertAtIndex >= 0 && insertAtIndex <= nextBullets.length) {
                  nextBullets.splice(insertAtIndex, 0, bulletText.trim());
                } else {
                  nextBullets.push(bulletText.trim());
                }
                return {
                  ...it,
                  bullets: nextBullets,
                };
              }
              return it;
            }),
          };
        } else if (targetType === 'summary') {
          return {
            ...prev,
            summary: prev.summary ? `${prev.summary} ${bulletText.trim()}` : bulletText.trim(),
          };
        }
        return prev;
      });
      setSaveSuccessMsg(`Added bullet to ${targetType === 'experience' ? 'experience position' : targetType === 'project' ? 'project' : 'summary'}!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    },
    [updateDataWithHistory]
  );

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      const isMod = isMac ? e.metaKey : e.ctrlKey;

      if (isMod && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (isMod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Toggle Accordion Section
  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1-Page Fit Calculation Heuristic
  const pageFitAnalysis = useMemo(() => {
    let totalLinesEstimate = 0;
    // Header & Contact
    totalLinesEstimate += 4;
    // Summary
    if (data.summary?.trim()) {
      totalLinesEstimate += Math.ceil(data.summary.length / 85) + 2;
    }
    // Skills
    if (data.skillCategories?.length > 0) {
      totalLinesEstimate += data.skillCategories.length + 2;
    }
    // Experience
    if (data.experience?.length > 0) {
      for (const exp of data.experience) {
        totalLinesEstimate += 2; // title line & dates
        totalLinesEstimate += (exp.bullets || []).filter(Boolean).length;
      }
    }
    // Projects
    if (data.projects?.length > 0) {
      for (const p of data.projects) {
        totalLinesEstimate += 1.5;
        totalLinesEstimate += (p.bullets || []).filter(Boolean).length;
      }
    }
    // Education
    totalLinesEstimate += (data.education?.length || 0) * 1.8 + 1;
    // Others
    if (data.certifications?.length > 0) totalLinesEstimate += data.certifications.length + 1;
    if (data.achievements?.length > 0) totalLinesEstimate += data.achievements.length + 1;
    if (data.languages?.length > 0) totalLinesEstimate += 2;

    const maxLinesForOnePage = compactSpacing ? 54 : 46;
    const isSinglePage = totalLinesEstimate <= maxLinesForOnePage;
    const estimatedPages = (totalLinesEstimate / maxLinesForOnePage).toFixed(1);

    return {
      totalLinesEstimate,
      maxLinesForOnePage,
      isSinglePage,
      estimatedPages,
      overflowLines: Math.max(0, Math.round(totalLinesEstimate - maxLinesForOnePage)),
    };
  }, [data, compactSpacing]);

  // Import from raw text or uploaded resume
  const handleImportResume = async (rawResumeToImport: string) => {
    if (!rawResumeToImport || !rawResumeToImport.trim()) {
      setImportNotice('No resume text available to import. Please upload a file or paste text first.');
      return;
    }

    setIsImporting(true);
    setImportNotice(null);
    try {
      const res = await fetch('/api/builder/import-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: rawResumeToImport }),
      });

      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || 'Failed to parse resume into structured format.');
      }

      updateDataWithHistory(() => json.data);
      setImportNotice('✓ Resume successfully imported into the live builder!');
      setTimeout(() => setImportNotice(null), 4000);
    } catch (err: any) {
      console.error('Import error:', err);
      setImportNotice(`Import error: ${err.message || 'Could not parse resume'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Generate Summary using Gemini
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const experienceSummary = data.experience
        .map((e) => `${e.role} at ${e.company}: ${(e.bullets || []).join(' ')}`)
        .join('\n');

      const res = await fetch('/api/builder/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_summary',
          text: data.summary || '',
          jobDescription: jobDescription || '',
          context: `${data.contact.fullName}, ${data.contact.jobTitle}. Experience: ${experienceSummary}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.data) throw new Error(json.error || 'Failed to generate summary');

      updateDataWithHistory((prev) => ({
        ...prev,
        summary: json.data.suggestion,
      }));
    } catch (err: any) {
      console.error(err);
      alert(`Summary generation failed: ${err.message}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Apply bullet rewrite from AI assistant modal
  const handleApplyAiRewrite = (newText: string) => {
    if (!aiAssistantTarget) return;

    if (aiAssistantTarget.section === 'experience' && aiAssistantTarget.itemId !== undefined && aiAssistantTarget.bulletIndex !== undefined) {
      const { itemId, bulletIndex } = aiAssistantTarget;
      updateDataWithHistory((prev) => ({
        ...prev,
        experience: prev.experience.map((exp) => {
          if (exp.id === itemId) {
            const nextBullets = [...exp.bullets];
            nextBullets[bulletIndex] = newText;
            return { ...exp, bullets: nextBullets };
          }
          return exp;
        }),
      }));
    } else if (aiAssistantTarget.section === 'projects' && aiAssistantTarget.itemId !== undefined && aiAssistantTarget.bulletIndex !== undefined) {
      const { itemId, bulletIndex } = aiAssistantTarget;
      updateDataWithHistory((prev) => ({
        ...prev,
        projects: prev.projects.map((proj) => {
          if (proj.id === itemId) {
            const nextBullets = [...proj.bullets];
            nextBullets[bulletIndex] = newText;
            return { ...proj, bullets: nextBullets };
          }
          return proj;
        }),
      }));
    } else if (aiAssistantTarget.section === 'summary') {
      updateDataWithHistory((prev) => ({
        ...prev,
        summary: newText,
      }));
    }
  };

  // Save New Named Version
  const handleSaveVersion = () => {
    const name = (newVersionName.trim() || `Version ${versions.length + 1}`);
    const newVer: ResumeVersion = {
      id: `ver_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(data)),
      templateId: selectedTemplate,
      accentColor,
      fontFamily,
    };

    setVersions((prev) => [newVer, ...prev]);
    setNewVersionName('');
    setIsSavingVersion(false);
    setSaveSuccessMsg(`Saved version: "${name}"`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Restore Version
  const handleRestoreVersion = (ver: ResumeVersion) => {
    updateDataWithHistory(() => JSON.parse(JSON.stringify(ver.data)));
    setSelectedTemplate(ver.templateId);
    setAccentColor(ver.accentColor);
    setFontFamily(ver.fontFamily);
    setSaveSuccessMsg(`Restored version: "${ver.name}"`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Exports
  const handleDownloadDocx = async () => {
    try {
      const blob = await generateDocxBlob(data, accentColor);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.contact.fullName.replace(/\s+/g, '_') || 'Resume'}_${selectedTemplate}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('DOCX export error:', err);
      alert('Failed to export DOCX: ' + err.message);
    }
  };

  const handleDownloadTxt = () => {
    const txt = generatePlainText(data);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.contact.fullName.replace(/\s+/g, '_') || 'Resume'}_ATS.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown(data);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.contact.fullName.replace(/\s+/g, '_') || 'Resume'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Builder Control Bar */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Title + Back + Undo/Redo */}
        <div className="flex flex-wrap items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            >
              &larr; Match Dashboard
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Live Resume Builder</h2>
              <p className="text-[11px] text-slate-400">
                Section-by-section form editor with real-time A4 preview and AI writing tools
              </p>
            </div>
          </div>

          {/* Undo / Redo Buttons */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/15">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Smart Populate, Import, Versions, Exports */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* AI Smart Populate Button */}
          <button
            onClick={() => {
              setSmartPopulateTarget(null);
              setIsSmartPopulateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Generate industry-standard bullet points based on job title or project"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI Smart Populate</span>
          </button>

          {/* Import Button */}
          {initialResumeText && (
            <button
              onClick={() => handleImportResume(initialResumeText)}
              disabled={isImporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-200 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 transition-colors cursor-pointer"
              title="Auto-fill the builder from your uploaded resume using Gemini JSON parsing"
            >
              {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{isImporting ? 'Importing...' : 'Import Current Resume'}</span>
            </button>
          )}

          {/* Version Save / Compare */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/15 rounded-xl p-1">
            <button
              onClick={() => setIsSavingVersion(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <Save className="w-3 h-3 text-emerald-400" />
              <span>Save Version</span>
            </button>

            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <GitCompare className="w-3 h-3 text-cyan-400" />
              <span>Compare ({versions.length})</span>
            </button>
          </div>

          {/* Export Dropdown Group */}
          <div className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-cyan-600 p-1 rounded-xl shadow-md">
            <button
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Print to PDF (clean vector selectable text)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadDocx}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Export formatted Microsoft Word document (.docx)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>DOCX</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Export clean plain text (.txt)"
            >
              <span>TXT</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Export Markdown (.md)"
            >
              <span>MD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banners */}
      {importNotice && (
        <div className="glass-panel p-3 bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 text-xs font-medium flex items-center justify-between animate-in fade-in">
          <span>{importNotice}</span>
          <button onClick={() => setImportNotice(null)} className="text-cyan-400 font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="glass-panel p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Save Version Modal */}
      {isSavingVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel bg-slate-900 border border-white/20 shadow-2xl p-5 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-white">Save Current Version</h3>
            <p className="text-xs text-slate-400">
              Save a tailored snapshot for a specific role or application (e.g. "Fintech Backend Lead").
            </p>
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="e.g. Senior Frontend - NexaCloud"
              className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsSavingVersion(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVersion}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
              >
                Save Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Split View: Left (Editor & Settings) / Right (Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================= */}
        {/* LEFT COLUMN: Section-by-Section Form Editor & Appearance Controls */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* Template, Color & Font Customizer Card */}
          <div className="glass-panel p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Template & Styling</span>
              </span>

              {/* One-page fit indicator */}
              <div
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  pageFitAnalysis.isSinglePage
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
                title={`Estimated lines: ${pageFitAnalysis.totalLinesEstimate} / ${pageFitAnalysis.maxLinesForOnePage}`}
              >
                {pageFitAnalysis.isSinglePage ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>1-Page Fit ({pageFitAnalysis.estimatedPages} p)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>{pageFitAnalysis.estimatedPages} Pages (+{pageFitAnalysis.overflowLines} lines)</span>
                  </>
                )}
              </div>
            </div>

            {/* 5 Selectable Templates Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {TEMPLATE_CONFIGS.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500/15 text-white shadow-md'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{tmpl.name}</div>
                      <span
                        className={`inline-block text-[9px] font-semibold mt-1 px-1 py-0.2 rounded ${
                          tmpl.atsSafe
                            ? 'text-emerald-300 bg-emerald-950/60'
                            : 'text-amber-300 bg-amber-950/60'
                        }`}
                      >
                        {tmpl.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Color & Font Picker Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
              {/* Accent Color Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-cyan-400" />
                  <span>Accent Color</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ACCENT_PRESETS.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setAccentColor(color.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        accentColor === color.hex ? 'scale-110 border-white ring-2 ring-cyan-400/40' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-6 h-6 rounded-full border border-white/20 bg-transparent cursor-pointer"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Font Family Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Type className="w-3 h-3 text-indigo-400" />
                  <span>Typography</span>
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as BuilderFontFamily)}
                  className="w-full bg-slate-950 text-white border border-white/20 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {FONT_PRESETS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.styleName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compact Fit Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span className="text-slate-300 font-medium">Tighten Spacing (1-Page Fit):</span>
              <button
                onClick={() => setCompactSpacing(!compactSpacing)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  compactSpacing
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {compactSpacing ? 'Compact ON' : 'Compact OFF'}
              </button>
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECTION 1: CONTACT DETAILS */}
          {/* =============================================================== */}
          <div className="glass-panel overflow-hidden">
            <div className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors">
              <button
                type="button"
                onClick={() => toggleSection('contact')}
                className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider cursor-pointer bg-transparent border-none p-0 text-left focus:outline-none flex-1"
              >
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <span>Contact Information</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSection('contact')}
                className="p-1 text-slate-400 hover:text-white cursor-pointer bg-transparent border-none focus:outline-none"
                aria-label="Toggle contact section"
              >
                {openSections.contact ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {openSections.contact && (
              <div className="p-4 pt-0 space-y-3 border-t border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={data.contact.fullName}
                      onChange={(e) =>
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, fullName: e.target.value },
                        }))
                      }
                      className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Target Job Title</label>
                    <input
                      type="text"
                      value={data.contact.jobTitle}
                      onChange={(e) =>
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, jobTitle: e.target.value },
                        }))
                      }
                      className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Email</label>
                    <input
                      type="email"
                      value={data.contact.email}
                      onChange={(e) =>
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, email: e.target.value },
                        }))
                      }
                      className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Phone</label>
                    <input
                      type="text"
                      value={data.contact.phone}
                      onChange={(e) =>
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, phone: e.target.value },
                        }))
                      }
                      className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Location</label>
                    <input
                      type="text"
                      value={data.contact.location}
                      onChange={(e) =>
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, location: e.target.value },
                        }))
                      }
                      className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">LinkedIn</label>
                    <input
                      type="text"
                      value={data.contact.linkedin || ''}
                      onChange={(e) =>
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, linkedin: e.target.value },
                        }))
                      }
                      placeholder="linkedin.com/in/username"
                      className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">GitHub</label>
                    <input
                      type="text"
                      value={data.contact.github || ''}
                      onChange={(e) =>
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, github: e.target.value },
                        }))
                      }
                      placeholder="github.com/username"
                      className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Portfolio / Website</label>
                    <input
                      type="text"
                      value={data.contact.website || ''}
                      onChange={(e) =>
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, website: e.target.value },
                        }))
                      }
                      placeholder="https://yoursite.com"
                      className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* SECTION 2: PROFESSIONAL SUMMARY */}
          {/* =============================================================== */}
          <div className="glass-panel overflow-hidden">
            <div className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors">
              <button
                type="button"
                onClick={() => toggleSection('summary')}
                className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider cursor-pointer bg-transparent border-none p-0 text-left focus:outline-none flex-1"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Professional Summary</span>
              </button>
              <div className="flex items-center gap-2">
                {openSections.summary && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateSummary();
                    }}
                    disabled={isGeneratingSummary}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-cyan-200 bg-cyan-950/70 border border-cyan-500/40 hover:bg-cyan-900/80 transition-colors cursor-pointer"
                  >
                    {isGeneratingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-cyan-400" />}
                    <span>AI Generate Summary</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleSection('summary')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer bg-transparent border-none focus:outline-none"
                  aria-label="Toggle summary section"
                >
                  {openSections.summary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {openSections.summary && (
              <div className="p-4 pt-0 space-y-2 border-t border-white/10">
                <textarea
                  rows={4}
                  value={data.summary}
                  onChange={(e) =>
                    updateDataWithHistory((prev) => ({
                      ...prev,
                      summary: e.target.value,
                    }))
                  }
                  placeholder="Compelling 3-4 sentence summary of your technical achievements, core strengths, and career focus..."
                  className="w-full bg-slate-950/80 border border-white/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 leading-relaxed"
                />

                {/* Drop Zone for Summary */}
                {isDraggingBullet && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                      setDragOverTargetId('summary_drop');
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        if (dragOverTargetId === 'summary_drop') setDragOverTargetId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverTargetId(null);
                      const text = e.dataTransfer.getData('text/plain');
                      if (text) {
                        handleInsertBullet('summary', '', text);
                      }
                    }}
                    className={`rounded-xl border-2 border-dashed p-2 text-center text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      dragOverTargetId === 'summary_drop'
                        ? 'border-indigo-400 bg-indigo-500/25 text-indigo-200 font-bold shadow-lg shadow-indigo-500/25 scale-[1.01]'
                        : 'border-indigo-400/50 bg-indigo-950/30 text-indigo-300 animate-pulse'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Drop bullet here to append into Professional Summary</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* SECTION 3: TECHNICAL SKILLS */}
          {/* =============================================================== */}
          <div className="glass-panel overflow-hidden">
            <div className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors">
              <button
                type="button"
                onClick={() => toggleSection('skills')}
                className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider cursor-pointer bg-transparent border-none p-0 text-left focus:outline-none flex-1"
              >
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>Technical Skills ({data.skillCategories.length} categories)</span>
              </button>
              <div className="flex items-center gap-2">
                {openSections.skills && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateDataWithHistory((prev) => ({
                        ...prev,
                        skillCategories: [
                          ...prev.skillCategories,
                          {
                            id: `cat_${Date.now()}`,
                            categoryName: 'New Category',
                            skills: ['Skill 1', 'Skill 2'],
                          },
                        ],
                      }));
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-200 bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900/80 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Category</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleSection('skills')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer bg-transparent border-none focus:outline-none"
                  aria-label="Toggle skills section"
                >
                  {openSections.skills ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {openSections.skills && (
              <div className="p-4 pt-0 space-y-3 border-t border-white/10">
                {data.skillCategories.map((cat, catIdx) => (
                  <div key={cat.id} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={cat.categoryName}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            skillCategories: prev.skillCategories.map((c) =>
                              c.id === cat.id ? { ...c, categoryName: val } : c
                            ),
                          }));
                        }}
                        className="bg-transparent font-bold text-xs text-white border-b border-white/20 pb-0.5 focus:outline-none focus:border-cyan-400"
                        placeholder="Category Name"
                      />
                      <button
                        onClick={() =>
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            skillCategories: prev.skillCategories.filter((c) => c.id !== cat.id),
                          }))
                        }
                        className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Skill chips input */}
                    <input
                      type="text"
                      value={cat.skills.join(', ')}
                      onChange={(e) => {
                        const val = e.target.value;
                        const split = val.split(',').map((s) => s.trim()).filter(Boolean);
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          skillCategories: prev.skillCategories.map((c) =>
                            c.id === cat.id ? { ...c, skills: split } : c
                          ),
                        }));
                      }}
                      placeholder="React, TypeScript, Redux (comma separated)"
                      className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* SECTION 4: WORK EXPERIENCE (WITH AI WRITING TOOLS) */}
          {/* =============================================================== */}
          <div className="glass-panel overflow-hidden">
            <div className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors">
              <button
                type="button"
                onClick={() => toggleSection('experience')}
                className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider cursor-pointer bg-transparent border-none p-0 text-left focus:outline-none flex-1"
              >
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <span>Work Experience ({data.experience.length})</span>
              </button>
              <div className="flex items-center gap-2">
                {openSections.experience && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          experience: [
                            {
                              id: `exp_${Date.now()}`,
                              role: 'Software Engineer',
                              company: 'Company Name',
                              location: 'Location',
                              startDate: '01/2023',
                              endDate: '',
                              current: true,
                              bullets: ['Engineered scalable web applications utilizing React and TypeScript.'],
                            },
                            ...prev.experience,
                          ],
                        }));
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-cyan-200 bg-cyan-950/70 border border-cyan-500/40 hover:bg-cyan-900/80 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Position</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSmartPopulateTarget(null);
                        setIsSmartPopulateOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 hover:bg-amber-900/80 transition-colors cursor-pointer"
                      title="Generate industry standard bullets for experience"
                    >
                      <Wand2 className="w-3 h-3 text-amber-300" />
                      <span>AI Smart Populate</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => toggleSection('experience')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer bg-transparent border-none focus:outline-none"
                  aria-label="Toggle experience section"
                >
                  {openSections.experience ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {openSections.experience && (
              <div className="p-4 pt-0 space-y-4 border-t border-white/10">
                {data.experience.map((exp, expIdx) => (
                  <div
                    key={exp.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                      if (dragOverTargetId !== `exp_${exp.id}`) {
                        setDragOverTargetId(`exp_${exp.id}`);
                      }
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverTargetId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverTargetId(null);
                      const text = e.dataTransfer.getData('text/plain');
                      if (text) {
                        handleInsertBullet('experience', exp.id, text);
                      }
                    }}
                    className={`p-3.5 rounded-xl bg-white/5 border transition-all space-y-3 ${
                      dragOverTargetId === `exp_${exp.id}`
                        ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/40'
                        : 'border-white/10'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-cyan-300">Position #{expIdx + 1}</span>
                      <div className="flex items-center gap-1">
                        {/* Move Up/Down */}
                        <button
                          disabled={expIdx === 0}
                          onClick={() => {
                            updateDataWithHistory((prev) => {
                              const arr = [...prev.experience];
                              const temp = arr[expIdx - 1];
                              arr[expIdx - 1] = arr[expIdx];
                              arr[expIdx] = temp;
                              return { ...prev, experience: arr };
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={expIdx === data.experience.length - 1}
                          onClick={() => {
                            updateDataWithHistory((prev) => {
                              const arr = [...prev.experience];
                              const temp = arr[expIdx + 1];
                              arr[expIdx + 1] = arr[expIdx];
                              arr[expIdx] = temp;
                              return { ...prev, experience: arr };
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              experience: prev.experience.filter((e) => e.id !== exp.id),
                            }))
                          }
                          className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer ml-1"
                          title="Delete position"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Role / Job Title</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              experience: prev.experience.map((it) => (it.id === exp.id ? { ...it, role: val } : it)),
                            }));
                          }}
                          className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Company Name</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              experience: prev.experience.map((it) => (it.id === exp.id ? { ...it, company: val } : it)),
                            }));
                          }}
                          className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              experience: prev.experience.map((it) => (it.id === exp.id ? { ...it, startDate: val } : it)),
                            }));
                          }}
                          placeholder="MM/YYYY"
                          className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                        <input
                          type="text"
                          disabled={exp.current}
                          value={exp.current ? 'Present' : exp.endDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              experience: prev.experience.map((it) => (it.id === exp.id ? { ...it, endDate: val } : it)),
                            }));
                          }}
                          placeholder="MM/YYYY or Present"
                          className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white disabled:opacity-50"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          id={`curr_${exp.id}`}
                          checked={exp.current}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              experience: prev.experience.map((it) => (it.id === exp.id ? { ...it, current: val } : it)),
                            }));
                          }}
                          className="rounded text-cyan-500 cursor-pointer"
                        />
                        <label htmlFor={`curr_${exp.id}`} className="text-xs text-slate-300 font-medium cursor-pointer">
                          Current Job
                        </label>
                      </div>
                    </div>

                    {/* Bullets with AI Writing Tools next to each bullet */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {dragOverTargetId === `exp_${exp.id}` && (
                        <div className="p-2.5 rounded-lg border-2 border-dashed border-cyan-400 bg-cyan-500/20 text-cyan-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Drop bullet here to add to {exp.role || 'this position'}!</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 uppercase">
                          Accomplishment Bullets ({exp.bullets?.length || 0})
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSmartPopulateTarget({
                                type: 'experience',
                                id: exp.id,
                                title: exp.role || 'Software Engineer',
                              });
                              setIsSmartPopulateOpen(true);
                            }}
                            className="text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                            title={`Generate industry standard bullets for ${exp.role || 'this role'}`}
                          >
                            <Wand2 className="w-3 h-3 text-amber-300" />
                            <span>AI Smart Populate</span>
                          </button>

                          <button
                            onClick={() => {
                              updateDataWithHistory((prev) => ({
                                ...prev,
                                experience: prev.experience.map((it) =>
                                  it.id === exp.id
                                    ? { ...it, bullets: [...it.bullets, 'Spearheaded implementation of [add metric] to improve performance.'] }
                                    : it
                                ),
                              }));
                            }}
                            className="text-[11px] font-bold text-cyan-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Bullet</span>
                          </button>
                        </div>
                      </div>

                      {exp.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="space-y-1.5 p-2 rounded-lg bg-slate-950/60 border border-white/10">
                          <div className="flex items-start gap-1.5">
                            <span className="text-slate-500 font-bold text-xs mt-1">•</span>
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateDataWithHistory((prev) => ({
                                  ...prev,
                                  experience: prev.experience.map((it) => {
                                    if (it.id === exp.id) {
                                      const arr = [...it.bullets];
                                      arr[bIdx] = val;
                                      return { ...it, bullets: arr };
                                    }
                                    return it;
                                  }),
                                }));
                              }}
                              className="flex-1 bg-transparent border-0 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded p-1 leading-relaxed"
                            />
                            <button
                              onClick={() => {
                                updateDataWithHistory((prev) => ({
                                  ...prev,
                                  experience: prev.experience.map((it) => {
                                    if (it.id === exp.id) {
                                      return { ...it, bullets: it.bullets.filter((_, idx) => idx !== bIdx) };
                                    }
                                    return it;
                                  }),
                                }));
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                              title="Delete bullet"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* 5 AI Writing Tool Buttons Next to Bullet */}
                          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">AI Tools:</span>
                            <button
                              type="button"
                              onClick={() =>
                                setAiAssistantTarget({
                                  section: 'experience',
                                  itemId: exp.id,
                                  bulletIndex: bIdx,
                                  text: bullet,
                                  action: 'improve',
                                })
                              }
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/15 text-cyan-300 hover:text-white transition-colors cursor-pointer"
                            >
                              Improve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAiAssistantTarget({
                                  section: 'experience',
                                  itemId: exp.id,
                                  bulletIndex: bIdx,
                                  text: bullet,
                                  action: 'add_action_verb',
                                })
                              }
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/15 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                            >
                              + Action Verb
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAiAssistantTarget({
                                  section: 'experience',
                                  itemId: exp.id,
                                  bulletIndex: bIdx,
                                  text: bullet,
                                  action: 'shorten',
                                })
                              }
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              Shorten
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAiAssistantTarget({
                                  section: 'experience',
                                  itemId: exp.id,
                                  bulletIndex: bIdx,
                                  text: bullet,
                                  action: 'make_impactful',
                                })
                              }
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/15 text-emerald-300 hover:text-white transition-colors cursor-pointer"
                            >
                              Impact (XYZ)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAiAssistantTarget({
                                  section: 'experience',
                                  itemId: exp.id,
                                  bulletIndex: bIdx,
                                  text: bullet,
                                  action: 'tailor',
                                })
                              }
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/15 text-amber-300 hover:text-white transition-colors cursor-pointer"
                            >
                              Tailor to Job
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Dedicated Drag & Drop Zone for Experience Position */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                          if (dragOverTargetId !== `exp_slot_${exp.id}`) {
                            setDragOverTargetId(`exp_slot_${exp.id}`);
                          }
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            if (dragOverTargetId === `exp_slot_${exp.id}`) setDragOverTargetId(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverTargetId(null);
                          const text = e.dataTransfer.getData('text/plain');
                          if (text) {
                            handleInsertBullet('experience', exp.id, text);
                          }
                        }}
                        className={`rounded-xl border-2 border-dashed p-2.5 text-center text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          dragOverTargetId === `exp_slot_${exp.id}`
                            ? 'border-cyan-400 bg-cyan-500/25 text-cyan-200 font-bold shadow-lg shadow-cyan-500/25 scale-[1.01]'
                            : isDraggingBullet
                            ? 'border-cyan-400/60 bg-cyan-950/40 text-cyan-300 animate-pulse'
                            : 'border-white/10 hover:border-cyan-400/40 text-slate-400 hover:text-cyan-300 bg-white/[0.02]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {dragOverTargetId === `exp_slot_${exp.id}`
                            ? `Release to insert bullet into ${exp.role || 'this role'}!`
                            : isDraggingBullet
                            ? `Drop here to add bullet to ${exp.role || 'this position'}`
                            : `Drag industry bullet here to add to ${exp.role || 'position'}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* SECTION 5: PROJECTS (WITH AI WRITING TOOLS) */}
          {/* =============================================================== */}
          <div className="glass-panel overflow-hidden">
            <div className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors">
              <button
                type="button"
                onClick={() => toggleSection('projects')}
                className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider cursor-pointer bg-transparent border-none p-0 text-left focus:outline-none flex-1"
              >
                <FolderGit2 className="w-4 h-4 text-indigo-400" />
                <span>Projects ({data.projects.length})</span>
              </button>
              <div className="flex items-center gap-2">
                {openSections.projects && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          projects: [
                            ...prev.projects,
                            {
                              id: `proj_${Date.now()}`,
                              title: 'Project Title',
                              techStack: 'React, Node.js',
                              link: 'https://github.com/project',
                              bullets: ['Engineered key features utilizing modern architectural patterns.'],
                            },
                          ],
                        }));
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-200 bg-indigo-950/70 border border-indigo-500/40 hover:bg-indigo-900/80 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Project</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSmartPopulateTarget(null);
                        setIsSmartPopulateOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 hover:bg-amber-900/80 transition-colors cursor-pointer"
                      title="Generate industry standard bullets for projects"
                    >
                      <Wand2 className="w-3 h-3 text-amber-300" />
                      <span>AI Smart Populate</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => toggleSection('projects')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer bg-transparent border-none focus:outline-none"
                  aria-label="Toggle projects section"
                >
                  {openSections.projects ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {openSections.projects && (
              <div className="p-4 pt-0 space-y-3 border-t border-white/10">
                {data.projects.map((proj) => (
                  <div
                    key={proj.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                      if (dragOverTargetId !== `proj_${proj.id}`) {
                        setDragOverTargetId(`proj_${proj.id}`);
                      }
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverTargetId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverTargetId(null);
                      const text = e.dataTransfer.getData('text/plain');
                      if (text) {
                        handleInsertBullet('project', proj.id, text);
                      }
                    }}
                    className={`p-3.5 rounded-xl bg-white/5 border transition-all space-y-2.5 ${
                      dragOverTargetId === `proj_${proj.id}`
                        ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/40'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Project Title</label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              projects: prev.projects.map((p) => (p.id === proj.id ? { ...p, title: val } : p)),
                            }));
                          }}
                          className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Tech Stack</label>
                        <input
                          type="text"
                          value={proj.techStack || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              projects: prev.projects.map((p) => (p.id === proj.id ? { ...p, techStack: val } : p)),
                            }));
                          }}
                          className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Project URL</label>
                          <input
                            type="text"
                            value={proj.link || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDataWithHistory((prev) => ({
                                ...prev,
                                projects: prev.projects.map((p) => (p.id === proj.id ? { ...p, link: val } : p)),
                              }));
                            }}
                            className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>
                        <button
                          onClick={() =>
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              projects: prev.projects.filter((p) => p.id !== proj.id),
                            }))
                          }
                          className="text-slate-400 hover:text-rose-400 p-1 mt-4 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bullets with AI Writing Tools next to each bullet */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {dragOverTargetId === `proj_${proj.id}` && (
                        <div className="p-2.5 rounded-lg border-2 border-dashed border-cyan-400 bg-cyan-500/20 text-cyan-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Drop bullet here to add to {proj.title || 'this project'}!</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 uppercase">
                          Project Bullets ({proj.bullets?.length || 0})
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSmartPopulateTarget({
                                type: 'project',
                                id: proj.id,
                                title: proj.title || 'Technical Project',
                              });
                              setIsSmartPopulateOpen(true);
                            }}
                            className="text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                            title={`Generate industry standard bullets for ${proj.title || 'this project'}`}
                          >
                            <Wand2 className="w-3 h-3 text-amber-300" />
                            <span>AI Smart Populate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateDataWithHistory((prev) => ({
                                ...prev,
                                projects: prev.projects.map((p) =>
                                  p.id === proj.id
                                    ? {
                                        ...p,
                                        bullets: [
                                          ...p.bullets,
                                          'Architected and deployed key features utilizing modern engineering practices.',
                                        ],
                                      }
                                    : p
                                ),
                              }));
                            }}
                            className="text-[11px] font-bold text-cyan-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Bullet</span>
                          </button>
                        </div>
                      </div>

                      {proj.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="space-y-1 p-2 rounded-lg bg-slate-950/60 border border-white/10">
                          <div className="flex items-start gap-1.5">
                            <span className="text-slate-500 font-bold text-xs mt-1">•</span>
                            <textarea
                              rows={2}
                              value={b}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateDataWithHistory((prev) => ({
                                  ...prev,
                                  projects: prev.projects.map((p) => {
                                    if (p.id === proj.id) {
                                      const arr = [...p.bullets];
                                      arr[bIdx] = val;
                                      return { ...p, bullets: arr };
                                    }
                                    return p;
                                  }),
                                }));
                              }}
                              className="flex-1 bg-transparent border-0 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded p-1 leading-relaxed"
                            />
                            <button
                              onClick={() => {
                                updateDataWithHistory((prev) => ({
                                  ...prev,
                                  projects: prev.projects.map((p) => {
                                    if (p.id === proj.id) {
                                      return { ...p, bullets: p.bullets.filter((_, idx) => idx !== bIdx) };
                                    }
                                    return p;
                                  }),
                                }));
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">AI Tools:</span>
                            <button
                              type="button"
                              onClick={() =>
                                setAiAssistantTarget({
                                  section: 'projects',
                                  itemId: proj.id,
                                  bulletIndex: bIdx,
                                  text: b,
                                  action: 'improve',
                                })
                              }
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/15 text-cyan-300 hover:text-white cursor-pointer"
                            >
                              Improve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAiAssistantTarget({
                                  section: 'projects',
                                  itemId: proj.id,
                                  bulletIndex: bIdx,
                                  text: b,
                                  action: 'add_action_verb',
                                })
                              }
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/15 text-indigo-300 hover:text-white cursor-pointer"
                            >
                              + Action Verb
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAiAssistantTarget({
                                  section: 'projects',
                                  itemId: proj.id,
                                  bulletIndex: bIdx,
                                  text: b,
                                  action: 'make_impactful',
                                })
                              }
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 hover:bg-white/15 text-emerald-300 hover:text-white cursor-pointer"
                            >
                              Impact (XYZ)
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Dedicated Drag & Drop Zone for Project */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                          if (dragOverTargetId !== `proj_slot_${proj.id}`) {
                            setDragOverTargetId(`proj_slot_${proj.id}`);
                          }
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            if (dragOverTargetId === `proj_slot_${proj.id}`) setDragOverTargetId(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverTargetId(null);
                          const text = e.dataTransfer.getData('text/plain');
                          if (text) {
                            handleInsertBullet('project', proj.id, text);
                          }
                        }}
                        className={`rounded-xl border-2 border-dashed p-2.5 text-center text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          dragOverTargetId === `proj_slot_${proj.id}`
                            ? 'border-cyan-400 bg-cyan-500/25 text-cyan-200 font-bold shadow-lg shadow-cyan-500/25 scale-[1.01]'
                            : isDraggingBullet
                            ? 'border-cyan-400/60 bg-cyan-950/40 text-cyan-300 animate-pulse'
                            : 'border-white/10 hover:border-cyan-400/40 text-slate-400 hover:text-cyan-300 bg-white/[0.02]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {dragOverTargetId === `proj_slot_${proj.id}`
                            ? `Release to insert bullet into ${proj.title || 'this project'}!`
                            : isDraggingBullet
                            ? `Drop here to add bullet to ${proj.title || 'this project'}`
                            : `Drag industry bullet here to add to ${proj.title || 'project'}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* SECTION 6: EDUCATION */}
          {/* =============================================================== */}
          <div className="glass-panel overflow-hidden">
            <div className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors">
              <button
                type="button"
                onClick={() => toggleSection('education')}
                className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider cursor-pointer bg-transparent border-none p-0 text-left focus:outline-none flex-1"
              >
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Education ({data.education.length})</span>
              </button>
              <div className="flex items-center gap-2">
                {openSections.education && (
                  <button
                    type="button"
                    onClick={() => {
                      updateDataWithHistory((prev) => ({
                        ...prev,
                        education: [
                          ...prev.education,
                          {
                            id: `edu_${Date.now()}`,
                            degree: 'B.S.',
                            field: 'Computer Science',
                            school: 'University Name',
                            location: 'City, State',
                            graduationDate: '2022',
                          },
                        ],
                      }));
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-200 bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900/80 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Degree</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleSection('education')}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer bg-transparent border-none focus:outline-none"
                  aria-label="Toggle education section"
                >
                  {openSections.education ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {openSections.education && (
              <div className="p-4 pt-0 space-y-3 border-t border-white/10">
                {data.education.map((edu) => (
                  <div key={edu.id} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              education: prev.education.map((ed) => (ed.id === edu.id ? { ...ed, degree: val } : ed)),
                            }));
                          }}
                          placeholder="B.S. or M.S."
                          className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Field of Study</label>
                        <input
                          type="text"
                          value={edu.field}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              education: prev.education.map((ed) => (ed.id === edu.id ? { ...ed, field: val } : ed)),
                            }));
                          }}
                          placeholder="Computer Science"
                          className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">School / Institution</label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDataWithHistory((prev) => ({
                                ...prev,
                                education: prev.education.map((ed) => (ed.id === edu.id ? { ...ed, school: val } : ed)),
                              }));
                            }}
                            className="w-full bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>
                        <button
                          onClick={() =>
                            updateDataWithHistory((prev) => ({
                              ...prev,
                              education: prev.education.filter((ed) => ed.id !== edu.id),
                            }))
                          }
                          className="text-slate-400 hover:text-rose-400 p-1 mt-4 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* SECTION 7: CERTIFICATIONS, ACHIEVEMENTS & LANGUAGES */}
          {/* =============================================================== */}
          <div className="glass-panel overflow-hidden">
            <div className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors">
              <button
                type="button"
                onClick={() => toggleSection('certifications')}
                className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider cursor-pointer bg-transparent border-none p-0 text-left focus:outline-none flex-1"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Certifications, Achievements & Languages</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSection('certifications')}
                className="p-1 text-slate-400 hover:text-white cursor-pointer bg-transparent border-none focus:outline-none"
                aria-label="Toggle certifications section"
              >
                {openSections.certifications ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {openSections.certifications && (
              <div className="p-4 pt-0 space-y-4 border-t border-white/10">
                {/* Certifications list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">Certifications</span>
                    <button
                      onClick={() =>
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          certifications: [
                            ...prev.certifications,
                            { id: `c_${Date.now()}`, name: 'Certification Name', issuer: 'Issuer', date: '2023' },
                          ],
                        }))
                      }
                      className="text-[11px] text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                  {data.certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            certifications: prev.certifications.map((c) => (c.id === cert.id ? { ...c, name: val } : c)),
                          }));
                        }}
                        placeholder="Certificate Title"
                        className="flex-1 bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={cert.issuer || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            certifications: prev.certifications.map((c) => (c.id === cert.id ? { ...c, issuer: val } : c)),
                          }));
                        }}
                        placeholder="Issuer (AWS, Google)"
                        className="w-32 bg-slate-950/80 border border-white/20 rounded-lg px-2 py-1 text-xs text-white"
                      />
                      <button
                        onClick={() =>
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            certifications: prev.certifications.filter((c) => c.id !== cert.id),
                          }))
                        }
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Languages */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Languages</span>
                    <button
                      onClick={() =>
                        updateDataWithHistory((prev) => ({
                          ...prev,
                          languages: [
                            ...prev.languages,
                            { id: `l_${Date.now()}`, language: 'Language', proficiency: 'Fluent' },
                          ],
                        }))
                      }
                      className="text-[11px] text-cyan-400 font-bold hover:underline cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                  {data.languages.map((l) => (
                    <div key={l.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={l.language}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            languages: prev.languages.map((it) => (it.id === l.id ? { ...it, language: val } : it)),
                          }));
                        }}
                        placeholder="Language"
                        className="flex-1 bg-slate-950/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={l.proficiency}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            languages: prev.languages.map((it) => (it.id === l.id ? { ...it, proficiency: val } : it)),
                          }));
                        }}
                        placeholder="Native / Professional"
                        className="w-40 bg-slate-950/80 border border-white/20 rounded-lg px-2 py-1 text-xs text-white"
                      />
                      <button
                        onClick={() =>
                          updateDataWithHistory((prev) => ({
                            ...prev,
                            languages: prev.languages.filter((it) => it.id !== l.id),
                          }))
                        }
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Live A4 Resume Preview */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 space-y-3 sticky top-24">
          <div className="flex items-center justify-between px-2 text-xs text-slate-300">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>A4 Live Preview ({TEMPLATE_CONFIGS.find((t) => t.id === selectedTemplate)?.name} Template)</span>
            </span>

            <span className="text-[11px] text-slate-400">
              Interactive preview updates instantly as you edit
            </span>
          </div>

          {/* Printable Preview Container */}
          <div className="max-h-[85vh] overflow-y-auto p-1.5 bg-slate-950/40 border border-white/10 rounded-2xl shadow-inner">
            <ResumeLivePreview
              data={data}
              templateId={selectedTemplate}
              accentColor={accentColor}
              fontFamily={fontFamily}
              compactSpacing={compactSpacing}
            />
          </div>
        </div>
      </div>

      {/* AI Bullet Writing Assistant Modal */}
      {aiAssistantTarget && (
        <AiBulletAssistantModal
          isOpen={Boolean(aiAssistantTarget)}
          onClose={() => setAiAssistantTarget(null)}
          originalText={aiAssistantTarget.text}
          jobDescription={jobDescription}
          initialAction={aiAssistantTarget.action}
          onApply={handleApplyAiRewrite}
        />
      )}

      {/* Versions Compare Modal */}
      {isCompareModalOpen && (
        <ResumeVersionCompareModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          versions={versions}
          onRestore={handleRestoreVersion}
        />
      )}

      {/* AI Smart Populate Modal / Docked Drawer */}
      <AiSmartPopulateModal
        isOpen={isSmartPopulateOpen}
        onClose={() => setIsSmartPopulateOpen(false)}
        experienceItems={data.experience}
        projectItems={data.projects}
        jobDescription={jobDescription}
        initialTarget={smartPopulateTarget}
        onInsertBullet={handleInsertBullet}
      />
    </div>
  );
};
