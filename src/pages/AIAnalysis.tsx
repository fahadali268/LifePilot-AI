import React, { useState, useEffect } from 'react';
import { Task, AIAnalysis as AIAnalysisType } from '../types';
import { 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  RotateCw, 
  Activity, 
  CheckCircle,
  TrendingDown,
  Gauge
} from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, DEFAULT_USER_ID } from '../firebase/config';

interface AIAnalysisProps {
  tasks: Task[];
}

export default function AIAnalysis({ tasks }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cached analysis on component mount
  useEffect(() => {
    const fetchCachedAnalysis = async () => {
      try {
        const cachedDoc = await getDoc(doc(db, 'ai_analysis', DEFAULT_USER_ID));
        if (cachedDoc.exists()) {
          setAnalysis(cachedDoc.data() as AIAnalysisType);
        }
      } catch (e) {
        console.warn('Failed to retrieve cached AI analysis', e);
      }
    };
    fetchCachedAnalysis();
  }, []);

  const handleAnalyze = async () => {
    if (tasks.length === 0) {
      setError("Please populate your task registry with at least one task before scanning.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });

      if (!response.ok) {
        throw new Error('AI analysis service failed. Please try again.');
      }

      const result = await response.json();
      const analysisData: AIAnalysisType = {
        highestRiskTaskId: result.highestRiskTaskId || null,
        highestRiskReason: result.highestRiskReason || "High risk calculated.",
        deadlineConflicts: result.deadlineConflicts || [],
        workloadIssues: result.workloadIssues || "Balanced workload.",
        suggestedOrder: result.suggestedOrder || [],
        analyzedAt: new Date().toISOString()
      };

      setAnalysis(analysisData);

      // Save to Firebase Firestore
      await setDoc(doc(db, 'ai_analysis', DEFAULT_USER_ID), analysisData);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  // Find task details from ID
  const getTaskById = (id: string) => tasks.find(t => t.id === id);

  const highestRiskTask = analysis?.highestRiskTaskId ? getTaskById(analysis.highestRiskTaskId) : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#18181B] border border-[#27272A] rounded-2xl p-6 md:p-8">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-purple-400 text-sm font-medium">
            <Sparkles className="w-4 h-4 animate-spin-slow text-purple-400" />
            <span className="font-mono tracking-wider uppercase">Agentic Risk Analyzer</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">AI Risk Scanner</h1>
          <p className="text-sm text-zinc-400 max-w-lg">
            Let Gemini inspect your registry timelines, flag deadline collisions, optimize completion priority vectors, and de-risk your week.
          </p>
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={loading || tasks.length === 0}
          className={`px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer flex items-center space-x-2 shadow-lg transition-all border ${
            loading 
              ? 'bg-purple-900/20 border-purple-800/40 text-purple-400 animate-pulse cursor-not-allowed'
              : tasks.length === 0
                ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/30 shadow-indigo-600/10'
          }`}
        >
          {loading ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Scanning Registry...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-purple-100" />
              <span>Run AI Risk Analysis</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-rose-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        /* Animated Scanning Radar / Loading Skeletons */
        <div className="space-y-6">
          <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Pulsing Scan Radar effect */}
            <div className="absolute w-64 h-64 rounded-full border border-indigo-500/10 animate-ping opacity-25"></div>
            <div className="absolute w-44 h-44 rounded-full border border-purple-500/10 animate-pulse opacity-40"></div>
            
            <Activity className="w-12 h-12 text-indigo-500 animate-pulse mb-4 z-10" />
            <h3 className="text-base font-semibold text-zinc-200 z-10">Gemini Agentic Reasoning Active</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 z-10">Analyzing task weight formulas, deadlines proximity matrix, and hour estimations to calculate optimum safety factors...</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#18181B]/50 border border-[#27272A] rounded-xl p-5 h-44 animate-pulse"></div>
            <div className="bg-[#18181B]/50 border border-[#27272A] rounded-xl p-5 h-44 animate-pulse"></div>
          </div>
        </div>
      ) : analysis ? (
        /* Real Analysis Panels */
        <div className="space-y-6">
          {/* Top Panel: Highest Risk Task & Workload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Card */}
            <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
              
              <div className="flex items-center justify-between border-b border-[#27272A]/60 pb-3">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold font-mono uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Maximum Risk Vector</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Calculated urgency score</span>
              </div>

              {highestRiskTask ? (
                <div className="mt-4 space-y-3">
                  <h3 className="text-lg font-bold text-white leading-snug">{highestRiskTask.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed bg-[#18181B] p-3.5 rounded-xl border border-[#27272A]">
                    {analysis.highestRiskReason}
                  </p>
                  <div className="flex items-center space-x-3 text-[10px] text-zinc-500 font-mono pt-2">
                    <span>Due: {new Date(highestRiskTask.deadline).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Estimation: {highestRiskTask.estimatedHours} hours</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-xs text-zinc-300 font-medium">All clear! No critical risks detected.</p>
                </div>
              )}
            </div>

            {/* Workload Health Card */}
            <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
              
              <div className="flex items-center justify-between border-b border-[#27272A]/60 pb-3">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold font-mono uppercase">
                  <Gauge className="w-4 h-4" />
                  <span>Workload Index</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Fatigue risk analysis</span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">Load Factor: {tasks.length > 5 ? 'High' : 'Moderate'}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed bg-[#18181B] p-3.5 rounded-xl border border-[#27272A]">
                  {analysis.workloadIssues}
                </p>
                <div className="flex items-center space-x-3 text-[10px] text-zinc-500 font-mono pt-2">
                  <span>Total hours: {tasks.reduce((sum, t) => sum + t.estimatedHours, 0)} hrs pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Collisions / Conflicts Panel */}
          <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-6">
            <h3 className="text-sm font-semibold font-mono uppercase text-amber-400 tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Deadline Collisions Detected ({analysis.deadlineConflicts.length})</span>
            </h3>

            {analysis.deadlineConflicts.length > 0 ? (
              <div className="space-y-4">
                {analysis.deadlineConflicts.map((conflict, index) => (
                  <div key={index} className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {conflict.taskIds.map((tid) => {
                        const t = getTaskById(tid);
                        return t ? (
                          <span key={tid} className="bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded border border-zinc-700 font-semibold truncate max-w-[200px]">
                            {t.title}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      💡 {conflict.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#18181B] border border-[#27272A]/40 p-6 rounded-xl text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span className="text-xs text-zinc-400 font-medium font-mono">No deadline collisions detected. Your spacing looks solid!</span>
              </div>
            )}
          </div>

          {/* Suggested Completion Order Timeline */}
          <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-6">
            <h3 className="text-sm font-semibold font-mono uppercase text-indigo-400 tracking-wider mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Optimum Completion Flow Chart</span>
            </h3>

            {analysis.suggestedOrder.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-indigo-500/20 space-y-6">
                {analysis.suggestedOrder.map((id, index) => {
                  const t = getTaskById(id);
                  if (!t) return null;

                  return (
                    <div key={id} className="relative group">
                      {/* Timeline Dot */}
                      <span className="absolute -left-9 top-1 w-5.5 h-5.5 rounded-full bg-zinc-950 border-2 border-indigo-500 flex items-center justify-center font-mono text-[9px] font-bold text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        {index + 1}
                      </span>

                      <div className="bg-[#18181B] border border-[#27272A] group-hover:border-indigo-500/40 rounded-xl p-4 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-xs font-semibold text-zinc-200">{t.title}</h4>
                          <span className={`text-[9px] font-mono font-medium px-2 py-0.2 rounded uppercase border shrink-0 ${
                            t.priority === 'high' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{t.description}</p>
                        <div className="flex items-center space-x-3 text-[10px] text-zinc-500 font-mono mt-2">
                          <span>Est: {t.estimatedHours}h</span>
                          <span>•</span>
                          <span>Due: {new Date(t.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 text-xs font-mono">
                Workload flow chart is empty. Create tasks to render flow paths.
              </div>
            )}
          </div>

          {/* Footer timestamp */}
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-500">
              Scanned at: {new Date(analysis.analyzedAt).toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-16 text-center flex flex-col items-center justify-center">
          <Sparkles className="w-12 h-12 text-purple-500 mb-4 animate-pulse" />
          <h2 className="text-lg font-bold text-white font-display">Run Your First Workspace Risk Scan</h2>
          <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-6">
            LifePilot AI will calculate load ratios, deadline conflicts, and priority sequencing automatically.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={tasks.length === 0}
            className={`px-5 py-2 rounded-lg font-semibold text-xs cursor-pointer flex items-center space-x-2 border transition-all ${
              tasks.length === 0
                ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scan Tasks Registry</span>
          </button>
        </div>
      )}
    </div>
  );
}
