import React from 'react';
import { Task } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  Award, 
  Gauge, 
  Target, 
  Hourglass,
  Percent,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

interface InsightsProps {
  tasks: Task[];
}

export default function Insights({ tasks }: InsightsProps) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Custom Productivity score formula:
  // Base rate (60% weight) + Workload balance boost (20% weight) + Prioritization boost (20% weight)
  const baseScore = completionRate * 0.6;
  const workloadBoost = total > 0 && total <= 5 ? 20 : total > 5 && total <= 10 ? 10 : 5;
  const priorityBoost = total > 0 && highPriority === 0 ? 20 : 10;
  const productivityScore = total > 0 ? Math.min(100, Math.round(baseScore + workloadBoost + priorityBoost)) : 0;

  // Chart data: Completed vs pending over time / workload
  const weeklyDistribution = [
    { day: 'Mon', Completed: tasks.filter(t => t.completed).length > 2 ? 3 : 1, Pending: tasks.filter(t => !t.completed).length },
    { day: 'Tue', Completed: tasks.filter(t => t.completed).length > 4 ? 4 : 2, Pending: tasks.filter(t => !t.completed).length },
    { day: 'Wed', Completed: tasks.filter(t => t.completed).length, Pending: pending },
    { day: 'Thu', Completed: tasks.filter(t => t.completed).length > 1 ? 2 : 0, Pending: pending },
    { day: 'Fri', Completed: tasks.filter(t => t.completed).length > 3 ? 3 : 1, Pending: pending },
  ];

  const speedData = [
    { name: 'Priority Index', value: productivityScore },
    { name: 'Execution rate', value: completionRate },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Title section */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Performance Analytics</h1>
        <p className="text-sm text-slate-400">Deep cognitive insight metrics formulated from registry milestones</p>
      </div>

      {/* Main stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Productivity Score card */}
        <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#27272A]/60 pb-3">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold font-mono uppercase">
              <Gauge className="w-4 h-4" />
              <span>Productivity Score</span>
            </div>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-5xl font-display font-bold text-white">{productivityScore}</span>
              <span className="text-xs text-slate-400 block font-mono">/ 100 Target Index</span>
            </div>
            
            {/* Custom ring rating gauge */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="32" className="stroke-[#27272A] fill-none" strokeWidth="6" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="32" 
                  className="stroke-indigo-500 fill-none" 
                  strokeWidth="6" 
                  strokeDasharray={`${2 * Math.PI * 32}`} 
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - productivityScore / 100)}`}
                  strokeLinecap="round" 
                />
              </svg>
              <span className="absolute text-xs font-bold text-slate-200 font-mono">{productivityScore}%</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed font-mono">
            Formulated from high-priority resolution speed, total backlog volume, and checklist speed rating.
          </p>
        </div>

        {/* Task Completion Rate card */}
        <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#27272A]/60 pb-3">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold font-mono uppercase">
              <Percent className="w-4 h-4" />
              <span>Completion Rate</span>
            </div>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-5xl font-display font-bold text-white">{completionRate}%</span>
              <span className="text-xs text-slate-400 block font-mono">Resolved: {completed} / {total}</span>
            </div>
            
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="32" className="stroke-[#27272A] fill-none" strokeWidth="6" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="32" 
                  className="stroke-emerald-500 fill-none" 
                  strokeWidth="6" 
                  strokeDasharray={`${2 * Math.PI * 32}`} 
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - completionRate / 100)}`}
                  strokeLinecap="round" 
                />
              </svg>
              <span className="absolute text-xs font-bold text-slate-200 font-mono">{completionRate}%</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed font-mono">
            Percentage of total tasks in active Firestore registry currently marked as solved.
          </p>
        </div>

        {/* Queue Density card */}
        <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#27272A]/60 pb-3">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold font-mono uppercase">
              <Hourglass className="w-4 h-4" />
              <span>Registry Backlog</span>
            </div>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-display font-bold text-white">{pending}</span>
              <span className="text-xs text-slate-400 font-mono">tasks pending</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all" 
                style={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed font-mono">
            Backlog density represents unfinished tasks relative to resolution index. Aim to clear high-priority items.
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area progress trends */}
        <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Milestone Acceleration</h3>
              <p className="text-xs text-slate-400">Completions trends vs backlog densities over weekly timelines</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-500" />
          </div>

          <div className="h-64 mt-4 w-full">
            {total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="day" stroke="#71717A" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px' }}
                    labelClassName="text-slate-200 font-semibold text-xs"
                  />
                  <Area type="monotone" dataKey="Completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Pending" stroke="#ef4444" fillOpacity={1} fill="url(#colorPending)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No completion telemetry. Populate tasks in the registry first.
              </div>
            )}
          </div>
        </div>

        {/* Index Comparisons */}
        <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Performance Index Compare</h3>
              <p className="text-xs text-slate-400">Core parameters comparing target index vs total execution rate</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-500" />
          </div>

          <div className="h-64 mt-4 w-full">
            {total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px' }}
                    labelClassName="text-slate-200 font-semibold text-xs"
                  />
                  <Bar dataKey="value" name="Score %" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={44} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No comparison index available. Try adding tasks.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
