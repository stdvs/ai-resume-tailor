import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wand2,
  Sparkles,
  GripVertical,
  Plus,
  Check,
  Copy,
  X,
  Briefcase,
  FolderGit2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Layers,
  Loader2,
  Info,
  CheckCircle2,
  Tag,
  Flame,
  Maximize2,
  Minimize2,
  Search,
} from 'lucide-react';
import { ResumeExperienceItem, ResumeProjectItem } from '../types';

export interface SmartBulletItem {
  id: string;
  text: string;
  actionVerb: string;
  impactFocus: string;
}

export interface SmartBulletCategory {
  categoryName: string;
  bullets: SmartBulletItem[];
}

interface AiSmartPopulateModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceItems: ResumeExperienceItem[];
  projectItems: ResumeProjectItem[];
  jobDescription?: string;
  initialTarget?: {
    type: 'experience' | 'project';
    id: string;
    title: string;
  } | null;
  onInsertBullet: (targetType: 'experience' | 'project', targetId: string, bulletText: string) => void;
}

const POPULAR_JOB_TITLES = [
  'Senior Frontend Engineer',
  'Full Stack Software Engineer',
  'Backend Systems Engineer',
  'DevOps & Cloud Architect',
  'Product Manager',
  'Data Engineer / ETL Specialist',
  'Machine Learning Engineer',
  'Mobile App Developer (iOS/Android)',
  'Engineering Manager',
  'QA Automation Engineer',
  'Cybersecurity Analyst',
  'UI/UX Design Technologist',
];

const PRESET_FALLBACK_BULLETS: Record<string, SmartBulletCategory[]> = {
  default: [
    {
      categoryName: 'Core Engineering & Delivery',
      bullets: [
        {
          id: 'fb_1',
          text: 'Architected and shipped mission-critical web application modules utilizing modern frameworks, scaling to serve over [add metric] daily active users.',
          actionVerb: 'Architected',
          impactFocus: 'Scalability',
        },
        {
          id: 'fb_2',
          text: 'Engineered resilient RESTful and GraphQL API services handling [add metric] requests/sec with 99.9% uptime SLA.',
          actionVerb: 'Engineered',
          impactFocus: 'Reliability',
        },
        {
          id: 'fb_3',
          text: 'Spearheaded migration of legacy monolith components into containerized microservices, reducing deployment cycle times by [add metric]%.',
          actionVerb: 'Spearheaded',
          impactFocus: 'Efficiency',
        },
      ],
    },
    {
      categoryName: 'Performance & Optimization',
      bullets: [
        {
          id: 'fb_4',
          text: 'Optimized frontend rendering bottlenecks and asset delivery pipelines, improving Core Web Vitals (LCP) from [add metric]s to [add metric]s.',
          actionVerb: 'Optimized',
          impactFocus: 'Performance',
        },
        {
          id: 'fb_5',
          text: 'Refactored complex database queries and added distributed caching layers, reducing peak response latencies by [add metric]%.',
          actionVerb: 'Refactored',
          impactFocus: 'Optimization',
        },
        {
          id: 'fb_6',
          text: 'Automated CI/CD validation workflows and unit test suites, boosting code coverage by [add metric]% and preventing regressions.',
          actionVerb: 'Automated',
          impactFocus: 'Quality',
        },
      ],
    },
    {
      categoryName: 'Leadership & Cross-Functional Impact',
      bullets: [
        {
          id: 'fb_7',
          text: 'Partnered with Product, Design, and QA leadership across 2-week agile sprints to ship [add metric] major feature initiatives ahead of schedule.',
          actionVerb: 'Partnered',
          impactFocus: 'Collaboration',
        },
        {
          id: 'fb_8',
          text: 'Mentored [add metric] junior and mid-level software engineers through structured pair programming, code reviews, and technical brown-bags.',
          actionVerb: 'Mentored',
          impactFocus: 'Leadership',
        },
        {
          id: 'fb_9',
          text: 'Authored comprehensive technical architecture documentation, system RFCs, and API specifications adopted team-wide.',
          actionVerb: 'Authored',
          impactFocus: 'Documentation',
        },
      ],
    },
  ],
};

export const AiSmartPopulateModal: React.FC<AiSmartPopulateModalProps> = ({
  isOpen,
  onClose,
  experienceItems,
  projectItems,
  jobDescription,
  initialTarget,
  onInsertBullet,
}) => {
  // Mode: select from existing resume item or enter custom job title
  const [sourceType, setSourceType] = useState<'existing' | 'custom'>('existing');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [customJobTitle, setCustomJobTitle] = useState<string>('');

  // Results State
  const [categories, setCategories] = useState<SmartBulletCategory[]>([]);
  const [cacheByTitle, setCacheByTitle] = useState<Record<string, SmartBulletCategory[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedNotice, setInsertedNotice] = useState<string | null>(null);
  const [isDocked, setIsDocked] = useState<boolean>(true); // default to docked side tray so user can drag directly into the editor

  // Derive target title
  const getResolvedTitle = useCallback(() => {
    if (sourceType === 'custom') {
      return customJobTitle.trim() || 'Software Engineer';
    }
    const [type, id] = selectedTargetId.split(':');
    if (type === 'experience') {
      const exp = experienceItems.find((e) => e.id === id);
      return exp ? exp.role || 'Software Engineer' : 'Software Engineer';
    } else if (type === 'project') {
      const p = projectItems.find((it) => it.id === id);
      return p ? p.title || 'Technical Project' : 'Technical Project';
    }
    return customJobTitle || 'Software Engineer';
  }, [sourceType, customJobTitle, selectedTargetId, experienceItems, projectItems]);

  // Generate Smart Bullets Call (with caching)
  const handleGenerateBullets = useCallback(
    async (overrideTitle?: string, isProjectItem?: boolean) => {
      const titleToUse = (overrideTitle || getResolvedTitle()).trim();
      if (!titleToUse) {
        setErrorMsg('Please select or specify a job title or project name.');
        return;
      }

      const cacheKey = titleToUse.toLowerCase();
      if (cacheByTitle[cacheKey] && cacheByTitle[cacheKey].length > 0) {
        setCategories(cacheByTitle[cacheKey]);
        return;
      }

      setIsLoading(true);
      setErrorMsg(null);

      try {
        const isProject = typeof isProjectItem === 'boolean'
          ? isProjectItem
          : selectedTargetId.startsWith('project:');

        const res = await fetch('/api/builder/smart-populate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: titleToUse,
            jobDescription: jobDescription || '',
            itemType: isProject ? 'project' : 'role',
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.data) {
          throw new Error(json.error || 'Failed to generate industry-standard bullet points.');
        }

        const resolvedCategories =
          json.data.categories && Array.isArray(json.data.categories) && json.data.categories.length > 0
            ? json.data.categories
            : PRESET_FALLBACK_BULLETS.default;

        setCategories(resolvedCategories);
        setCacheByTitle((prev) => ({ ...prev, [cacheKey]: resolvedCategories }));
      } catch (err: any) {
        console.warn('Smart populate API error, displaying curated industry bullets:', err);
        setCategories(PRESET_FALLBACK_BULLETS.default);
      } finally {
        setIsLoading(false);
      }
    },
    [getResolvedTitle, cacheByTitle, selectedTargetId, jobDescription]
  );

  // Sync initial target if provided or auto-select first role/project
  useEffect(() => {
    if (initialTarget && initialTarget.id) {
      setSourceType('existing');
      setSelectedTargetId(`${initialTarget.type}:${initialTarget.id}`);
      setCustomJobTitle(initialTarget.title || '');
      handleGenerateBullets(initialTarget.title, initialTarget.type === 'project');
    } else if (isOpen && categories.length === 0 && !isLoading) {
      if (experienceItems.length > 0) {
        setSelectedTargetId(`experience:${experienceItems[0].id}`);
        setCustomJobTitle(experienceItems[0].role || 'Software Engineer');
        handleGenerateBullets(experienceItems[0].role || 'Software Engineer', false);
      } else if (projectItems.length > 0) {
        setSelectedTargetId(`project:${projectItems[0].id}`);
        setCustomJobTitle(projectItems[0].title || 'Technical Project');
        handleGenerateBullets(projectItems[0].title || 'Technical Project', true);
      } else {
        handleGenerateBullets('Software Engineer', false);
      }
    }
  }, [initialTarget, isOpen]);

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, bullet: SmartBulletItem) => {
    e.dataTransfer.setData('text/plain', bullet.text);
    e.dataTransfer.setData('application/json', JSON.stringify(bullet));
    e.dataTransfer.setData('application/x-resume-bullet', bullet.text);
    e.dataTransfer.effectAllowed = 'copyMove';

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('resume-bullet-drag-start', {
          detail: { text: bullet.text, actionVerb: bullet.actionVerb },
        })
      );
    }
  };

  // Handle Drag End
  const handleDragEnd = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resume-bullet-drag-end'));
    }
  };

  // Handle 1-click Insert
  const handleDirectInsert = (bullet: SmartBulletItem, explicitTargetId?: string) => {
    const targetKey = explicitTargetId || selectedTargetId;
    const [type, id] = targetKey.split(':');
    if (!type || !id) {
      // Default to first experience item
      if (experienceItems.length > 0) {
        onInsertBullet('experience', experienceItems[0].id, bullet.text);
        showInsertedToast(experienceItems[0].role || 'Experience');
      }
      return;
    }

    onInsertBullet(type as 'experience' | 'project', id, bullet.text);
    let name = 'Resume Section';
    if (type === 'experience') {
      const exp = experienceItems.find((e) => e.id === id);
      name = exp?.role ? `"${exp.role}"` : 'Experience';
    } else {
      const p = projectItems.find((it) => it.id === id);
      name = p?.title ? `"${p.title}"` : 'Project';
    }
    showInsertedToast(name);
  };

  const showInsertedToast = (destinationName: string) => {
    setInsertedNotice(`Added bullet to ${destinationName}!`);
    setTimeout(() => setInsertedNotice(null), 3500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter bullets with memoization and search support (Hooks must always run unconditionally)
  const visibleCategories = useMemo(() => {
    let list =
      activeCategoryFilter === 'all'
        ? categories
        : categories.filter((c) => c.categoryName === activeCategoryFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list
        .map((cat) => ({
          ...cat,
          bullets: (cat.bullets || []).filter(
            (b) =>
              b.text.toLowerCase().includes(q) ||
              b.actionVerb.toLowerCase().includes(q) ||
              (b.impactFocus && b.impactFocus.toLowerCase().includes(q))
          ),
        }))
        .filter((cat) => cat.bullets.length > 0);
    }
    return list;
  }, [categories, activeCategoryFilter, searchQuery]);

  const totalBulletCount = categories.reduce((sum, c) => sum + (c.bullets?.length || 0), 0);

  if (!isOpen) return null;

  const panelBody = (
    <>
      {/* Configuration Bar */}
        <div className="p-4 border-b border-white/10 bg-slate-950/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Source Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSourceType('existing')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  sourceType === 'existing'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Select from Resume</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceType('custom')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  sourceType === 'custom'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom Role / Title</span>
              </button>
            </div>

            {/* Generate Trigger */}
            <button
              onClick={() => handleGenerateBullets()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #4f46e5)',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Bullets...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-cyan-200" />
                  <span>Generate Bullets for this Role</span>
                </>
              )}
            </button>
          </div>

          {/* Source Input / Picker */}
          {sourceType === 'existing' ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs font-bold text-slate-400 whitespace-nowrap">
                Target Role / Project:
              </label>
              <select
                value={selectedTargetId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTargetId(val);
                  const [t, id] = val.split(':');
                  let newTitle = '';
                  if (t === 'experience') {
                    const item = experienceItems.find((x) => x.id === id);
                    if (item?.role) newTitle = item.role;
                  } else {
                    const item = projectItems.find((x) => x.id === id);
                    if (item?.title) newTitle = item.title;
                  }
                  if (newTitle) {
                    setCustomJobTitle(newTitle);
                    handleGenerateBullets(newTitle, t === 'project');
                  }
                }}
                className="flex-1 bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <optgroup label="Work Experience Positions">
                  {experienceItems.map((exp, idx) => (
                    <option key={`experience:${exp.id}`} value={`experience:${exp.id}`}>
                      💼 #{idx + 1}: {exp.role || 'Untitled Role'} {exp.company ? `(${exp.company})` : ''}
                    </option>
                  ))}
                </optgroup>
                {projectItems.length > 0 && (
                  <optgroup label="Featured Projects">
                    {projectItems.map((proj, idx) => (
                      <option key={`project:${proj.id}`} value={`project:${proj.id}`}>
                        🚀 Project #{idx + 1}: {proj.title || 'Untitled Project'}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Senior Cloud Architect, DevOps Engineer, Full Stack Developer..."
                  value={customJobTitle}
                  onChange={(e) => setCustomJobTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerateBullets();
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Suggestions:</span>
                {POPULAR_JOB_TITLES.slice(0, 6).map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => {
                      setCustomJobTitle(title);
                      handleGenerateBullets(title);
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drag & Drop Notice Banner */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border-b border-white/10 flex items-center justify-between text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 animate-pulse" />
            <span>
              <strong>Drag & Drop Ready:</strong> Grab any bullet by the handle (⋮⋮) and drop it into any role or project card on your resume!
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
            {totalBulletCount} industry-standard bullets available
          </span>
        </div>

        {/* Feedback Alert Banner */}
        {insertedNotice && (
          <div className="p-3 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{insertedNotice}</span>
          </div>
        )}

        {/* Category Filters & Search */}
        {categories.length > 0 && (
          <div className="border-b border-white/10 bg-white/[0.02]">
            <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeCategoryFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                All Categories ({totalBulletCount})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.categoryName}
                  onClick={() => setActiveCategoryFilter(cat.categoryName)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeCategoryFilter === cat.categoryName
                      ? 'bg-cyan-400 text-slate-950 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.categoryName} ({cat.bullets.length})
                </button>
              ))}
            </div>

            {/* Keyword Search Filter Bar */}
            <div className="px-4 pb-2.5 pt-0.5 flex items-center gap-2">
              <div className="relative flex-1 flex items-center bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Filter bullets by keyword (e.g. React, CI/CD, Latency, Architecture)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Body: Scrollable Bullets Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm font-bold text-white">
                Consulting industry-standard benchmarks for &ldquo;{getResolvedTitle()}&rdquo;...
              </p>
              <p className="text-xs text-slate-400">
                Formulating strong action verbs and Google XYZ impact placeholders
              </p>
            </div>
          ) : visibleCategories.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-semibold text-slate-300">No bullets found.</p>
              <p className="text-xs">
                {searchQuery
                  ? `No bullets match "${searchQuery}". Clear your search query to see all bullets.`
                  : 'Click "Generate Bullets for this Role" above to query Gemini.'}
              </p>
            </div>
          ) : (
            visibleCategories.map((category) => (
              <div key={category.categoryName} className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{category.categoryName}</span>
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400">
                    {category.bullets.length} bullets
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {category.bullets.map((bullet) => {
                    const isCopied = copiedId === bullet.id;

                    return (
                      <div
                        key={bullet.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, bullet)}
                        onDragEnd={handleDragEnd}
                        className="group relative p-3.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-grab active:cursor-grabbing flex items-start gap-3 select-none"
                      >
                        {/* Drag Handle Icon */}
                        <div
                          className="p-1 rounded-md text-slate-400 group-hover:text-cyan-300 group-hover:bg-cyan-500/20 transition-colors flex-shrink-0 mt-0.5"
                          title="Drag this bullet into any position on the resume editor"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Bullet Body */}
                        <div className="flex-1 space-y-2">
                          <p className="text-xs text-slate-100 leading-relaxed">
                            {/* Highlight [add metric] placeholders */}
                            {bullet.text.split(/(\[add metric\]%?|\[add %\])/g).map((chunk, i) => {
                              if (chunk.startsWith('[add')) {
                                return (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30"
                                  >
                                    {chunk}
                                  </span>
                                );
                              }
                              return <span key={i}>{chunk}</span>;
                            })}
                          </p>

                          {/* Metadata Tags & Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Verb: {bullet.actionVerb}
                              </span>
                              {bullet.impactFocus && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
                                  {bullet.impactFocus}
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              {/* Copy Button */}
                              <button
                                type="button"
                                onClick={() => handleCopy(bullet.text, bullet.id)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Copy bullet text"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-300">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-400" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              {/* 1-Click Insert Button */}
                              <button
                                type="button"
                                onClick={() => handleDirectInsert(bullet)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-sm transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                                title="Add bullet into selected position on the left"
                              >
                                <Plus className="w-3 h-3 text-white" />
                                <span>Add to Section</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              Strict Anti-Hallucination Policy: All metrics use <code>[add metric]</code> placeholders.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-colors cursor-pointer self-end sm:self-auto"
          >
            Done
          </button>
        </div>
      </>
  );

  // 1. DOCKED SIDE TRAY MODE (Drag & Drop friendly side-by-side with resume editor)
  if (isDocked) {
    return (
      <div className="fixed top-16 right-4 bottom-4 w-full sm:w-[500px] max-w-[94vw] z-50 flex flex-col rounded-2xl border border-cyan-400/50 bg-slate-900/98 backdrop-blur-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Docked Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between gap-2 bg-white/[0.04] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #4f46e5)',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
              }}
            >
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-tight">AI Smart Populate</h3>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                  Side Tray
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Drag handle (⋮⋮) into any position on the left
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsDocked(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Expand to centered dialog"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {panelBody}
      </div>
    );
  }

  // 2. FULL CENTER MODAL MODE
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-white/20 bg-slate-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Full Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-white/[0.04] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #4f46e5)',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
              }}
            >
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">AI Smart Populate</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                  Full View
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate industry-standard achievement bullets tailored to any role or project
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsDocked(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors cursor-pointer mr-1"
              title="Dock to side to drag & drop into resume"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Dock to Side</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {panelBody}
      </div>
    </div>
  );
};
