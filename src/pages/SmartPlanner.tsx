import React, { useState, useEffect } from 'react';
import { Task, SmartPlan as SmartPlanType, ScheduleItem } from '../types';
import { 
  Calendar, 
  Sparkles, 
  Coffee, 
  Compass, 
  Sunset, 
  Moon, 
  Check, 
  RotateCw, 
  AlertTriangle,
  Briefcase,
  Layers,
  Heart,
  ChevronRight
} from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, DEFAULT_USER_ID } from '../firebase/config';

interface SmartPlannerProps {
  tasks: Task[];
  onCompleteTask: (id: string, completed: boolean) => void;
}

export default function SmartPlanner({ tasks, onCompleteTask }: SmartPlannerProps) {
  const [plan, setPlan] = useState<SmartPlanType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cached schedule on component mount
  useEffect(() => {
    const fetchCachedSchedule = async () => {
      try {
        const cachedDoc = await getDoc(doc(db, 'schedules', DEFAULT_USER_ID));
        if (cachedDoc.exists()) {
          setPlan(cachedDoc.data() as SmartPlanType);
        }
      } catch (e) {
        console.warn('Failed to retrieve cached plan', e);
      }
    };
    fetchCachedSchedule();
  }, []);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });

      if (!response.ok) {
        throw new Error('Planner service failed to assemble schedule. Try again.');
      }

      const result = await response.json();
      const planData: SmartPlanType = {
        morning: result.morning || [],
        afternoon: result.afternoon || [],
        evening: result.evening || [],
        night: result.night || [],
        createdAt: new Date().toISOString()
      };

      setPlan(planData);

      // Cache schedule in Firestore
      await setDoc(doc(db, 'schedules', DEFAULT_USER_ID), planData);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during scheduling.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to match taskId to Task
  const getTaskById = (id: string) => tasks.find(t => t.id === id);

  const renderScheduleSection = (title: string, items: ScheduleItem[], icon: React.ReactNode, themeClass: string) => {
    return (
      <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-6 space-y-4">
        {/* Header segment */}
        <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
          <div className="flex items-center space-x-2.5">
            <span className={`p-1.5 rounded-lg ${themeClass}`}>
              {icon}
            </span>
            <span className="font-display font-semibold text-white text-sm">{title} Segment</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">{items.length} Blocks allocated</span>
        </div>

        {/* List of schedule blocks */}
        <div className="space-y-3">
          {items.map((item, idx) => {
            const linkedTask = item.taskId ? getTaskById(item.taskId) : null;
            const isRest = !linkedTask;

            return (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isRest 
                    ? 'bg-[#09090B] border-[#27272A]/50 hover:border-[#27272A]' 
                    : linkedTask?.completed
                      ? 'bg-emerald-950/10 border-emerald-950/20 hover:border-emerald-500/10'
                      : 'bg-[#18181B] border-[#27272A] hover:border-indigo-500/20'
                }`}
              >
                {/* Left side: Time, icon, task title or custom description */}
                <div className="flex items-start space-x-3.5 min-w-0">
                  <div className="text-[10px] font-mono text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-md shrink-0 self-center">
                    {item.timeSlot}
                  </div>
                  
                  <div className="min-w-0">
                    {isRest ? (
                      <div className="flex items-center space-x-2">
                        <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-xs text-zinc-300 font-semibold truncate">
                          {item.customActivity || "Sustenance & Recovery Rest"}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className={`text-xs font-bold block truncate leading-snug ${
                          linkedTask.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'
                        }`}>
                          {linkedTask.title}
                        </span>
                        <div className="flex items-center space-x-2 mt-1.5">
                          <span className={`text-[8px] font-mono font-medium px-1.5 py-0.2 rounded border uppercase ${
                            linkedTask.priority === 'high' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}>
                            {linkedTask.priority}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            Est: {linkedTask.estimatedHours}h
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Duration + Completion trigger for tasks */}
                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                  <span className="text-[10px] font-mono text-zinc-500 bg-[#18181B] px-2 py-0.5 rounded border border-[#27272A]">
                    ⏱️ {item.duration}
                  </span>

                  {!isRest && (
                    <button
                      onClick={() => onCompleteTask(linkedTask.id, !linkedTask.completed)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        linkedTask.completed 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                          : 'bg-zinc-800 border border-zinc-700 hover:border-indigo-500 hover:bg-indigo-500/5 text-zinc-400 hover:text-indigo-400'
                      }`}
                      title={linkedTask.completed ? "Mark pending" : "Mark completed"}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#18181B] border border-[#27272A] rounded-2xl p-6 md:p-8">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400 text-sm font-medium">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="font-mono tracking-wider uppercase">Auto-Schedules Assembler</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">Smart Planner</h1>
          <p className="text-sm text-zinc-400 max-w-lg">
            Delegate hourly schedule structuring to the Gemini planner. Align tasks dynamically around natural fatigue cycles and rest slots.
          </p>
        </div>
        
        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          className={`px-5 py-2 rounded-lg font-semibold text-sm cursor-pointer flex items-center space-x-2 shadow-lg border transition-all ${
            loading 
              ? 'bg-indigo-900/20 border-indigo-800/40 text-indigo-400 animate-pulse cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/30 shadow-indigo-600/10'
          }`}
        >
          {loading ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Mapping Daily Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Assemble Daily Smart Plan</span>
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
        /* Timeline Assembly Loading State */
        <div className="space-y-6">
          <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <RotateCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <span className="text-sm font-semibold text-zinc-300">Formulating optimum chronological schedule blocks...</span>
            <span className="text-xs text-zinc-500 mt-1 max-w-xs">Arranging focus blocks, estimating buffer reserves, and compiling a daily flight plan.</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-44 rounded-xl bg-[#18181B]/50 border border-[#27272A] animate-pulse"></div>
            <div className="h-44 rounded-xl bg-[#18181B]/50 border border-[#27272A] animate-pulse"></div>
          </div>
        </div>
      ) : plan ? (
        /* Render Schedule divided in quadrants */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderScheduleSection(
              "Morning", 
              plan.morning, 
              <Briefcase className="w-4 h-4 text-emerald-400" />, 
              "bg-emerald-500/10"
            )}
            {renderScheduleSection(
              "Afternoon", 
              plan.afternoon, 
              <Compass className="w-4 h-4 text-amber-400" />, 
              "bg-amber-500/10"
            )}
            {renderScheduleSection(
              "Evening", 
              plan.evening, 
              <Sunset className="w-4 h-4 text-orange-400" />, 
              "bg-orange-500/10"
            )}
            {renderScheduleSection(
              "Night", 
              plan.night, 
              <Moon className="w-4 h-4 text-indigo-400" />, 
              "bg-indigo-500/10"
            )}
          </div>

          {/* Footer timestamp */}
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-500">
              Generated at: {new Date(plan.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-16 text-center flex flex-col items-center justify-center">
          <Calendar className="w-12 h-12 text-zinc-700 mb-4 animate-pulse" />
          <h2 className="text-lg font-bold text-white font-display">Generate Your Interactive Flight Schedule</h2>
          <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-6">
            Map all registered tasks around fatigue windows and structured focus rhythms with one-click agentic alignment.
          </p>
          <button
            onClick={handleGeneratePlan}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer"
          >
            Assemble Flight Plan
          </button>
        </div>
      )}
    </div>
  );
}
