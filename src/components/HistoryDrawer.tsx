import React, { useEffect, useState } from 'react';
import { db, collection, query, orderBy, getDocs, deleteDoc, doc, User } from '../lib/firebase';
import { UserHistoryItem } from '../types';
import {
  X,
  History,
  Trash2,
  Calendar,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  memoryHistory?: UserHistoryItem[];
  onSelectAnalysis: (item: UserHistoryItem) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  user,
  memoryHistory = [],
  onSelectAnalysis,
}) => {
  const [cloudItems, setCloudItems] = useState<UserHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const analysesRef = collection(db, 'users', user.uid, 'analyses');
      const q = query(analysesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items: UserHistoryItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          createdAt: data.createdAt || new Date().toISOString(),
          jobTitle: data.jobTitle || 'Target Role',
          matchScore: data.matchScore || 0,
          scoreExplanation: data.scoreExplanation || '',
          matchingSkills: data.matchingSkills || [],
          missingKeywords: data.missingKeywords || [],
          bulletsToRewrite: data.bulletsToRewrite || [],
          top5Changes: data.top5Changes || [],
          preApplyChecklist: data.preApplyChecklist || [],
          tailoredResumeText: data.tailoredResumeText || '',
          atsSimulation: data.atsSimulation,
        });
      });
      setCloudItems(items);
    } catch (err) {
      console.error('Failed to fetch user analysis history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory();
    }
  }, [isOpen, user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'analyses', id));
      setCloudItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete history item:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  // Combine cloud items or fallback to memory items (last 5)
  const displayItems = user && cloudItems.length > 0 ? cloudItems : memoryHistory;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900/95 border-l border-white/20 h-full shadow-2xl flex flex-col backdrop-blur-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ background: 'var(--accent)' }}
            >
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Analysis History
              </h2>
              <p className="text-xs text-slate-400">
                {user ? user.email : 'In-Memory Session (Last 5)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={fetchHistory}
                disabled={loading}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Refresh history"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close history drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-xs font-medium text-slate-300">Loading saved analyses...</p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-slate-400 mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No past analyses recorded</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Run an ATS match analysis to automatically log your tailored resume history here for instant recall.
              </p>
            </div>
          ) : (
            displayItems.slice(0, 10).map((item) => {
              const score = item.matchScore;
              const isHigh = score >= 75;
              const isMid = score >= 50;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectAnalysis(item);
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/25 transition-all cursor-pointer shadow-sm group space-y-2 relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {item.jobTitle || 'Target Role'}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    </div>

                    {/* Score Badge */}
                    <span
                      className={`text-xs font-mono font-black px-2 py-0.5 rounded-full border shadow-2xs ${
                        isHigh
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : isMid
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {score}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {item.scoreExplanation}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                    <span>
                      {item.matchingSkills.length} skills · {item.missingKeywords.length} gaps
                    </span>

                    {user && (
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        disabled={deletingId === item.id}
                        className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] text-[11px] text-slate-400 text-center">
          Click any report to instantly recall full scores, bullet rewrites & checklist.
        </div>
      </div>
    </div>
  );
};
