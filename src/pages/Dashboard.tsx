import React from 'react';
import { Task } from '../types';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Zap, 
  Plus, 
  Sparkles,
  CalendarDays
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

interface DashboardProps {
  tasks: Task[];
  onAddTaskClick: () => void;
  onCompleteTask: (id: string, completed: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ tasks, onAddTaskClick, onCompleteTask, setActiveTab }: DashboardProps) {
  // Stat calculations
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const highPriorityPending = tasks.filter(t => t.priority === 'high' && !t.completed).length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Tasks sorted by deadline
  const upcomingTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  // Recharts Chart Data (Priorities & Workload distribution)
  const priorityData = [
    { name: 'High', pending: tasks.filter(t => t.priority === 'high' && !t.completed).length, completed: tasks.filter(t => t.priority === 'high' && t.completed).length },
    { name: 'Medium', pending: tasks.filter(t => t.priority === 'medium' && !t.completed).length, completed: tasks.filter(t => t.priority === 'medium' && t.completed).length },
    { name: 'Low', pending: tasks.filter(t => t.priority === 'low' && !t.completed).length, completed: tasks.filter(t => t.priority === 'low' && t.completed).length },
  ];

  const effortData = [
    { day: 'Mon', hours: totalTasks > 0 ? 4 : 0 },
    { day: 'Tue', hours: totalTasks > 0 ? 6 : 0 },
    { day: 'Wed', hours: totalTasks > 0 ? 8 : 0 },
    { day: 'Thu', hours: totalTasks > 0 ? 5 : 0 },
    { day: 'Fri', hours: totalTasks > 0 ? 7 : 0 },
    { day: 'Sat', hours: totalTasks > 0 ? 3 : 0 },
    { day: 'Sun', hours: totalTasks > 0 ? 2 : 0 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#18181B] border border-[#27272A] rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-2 text-indigo-400 text-sm font-medium">
            <Zap className="w-4 h-4 fill-indigo-400" />
            <span className="font-mono tracking-wider uppercase">Copilot Core Active</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Welcome Back, Pilot
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl">
            LifePilot AI has scanned your Firestore registry. You currently have <span className="text-indigo-400 font-semibold">{pendingTasks} pending tasks</span> across your timeline. Let's optimize your schedules and avoid miss-factor.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={() => setActiveTab('analysis')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Scan Risks</span>
          </button>
          <button
            onClick={onAddTaskClick}
            className="px-4 py-2 bg-[#18181B] hover:bg-zinc-800 text-zinc-200 font-medium text-sm rounded-lg border border-[#27272A] transition-all cursor-pointer flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Tasks Card */}
        <div className="bg-[#09090B] border border-[#27272A] p-5 rounded-2xl relative group overflow-hidden transition-all duration-200 hover:border-zinc-700">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.02] group-hover:scale-110 transition-transform duration-300">
            <CheckSquare className="w-32 h-32 text-indigo-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 tracking-wider uppercase">Total Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#FAFAFA]">{totalTasks}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2 font-mono">+12% this week</p>
        </div>

        {/* Pending Tasks Card */}
        <div className="bg-[#09090B] border border-[#27272A] p-5 rounded-2xl relative group overflow-hidden transition-all duration-200 hover:border-zinc-700">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.02] group-hover:scale-110 transition-transform duration-300">
            <Clock className="w-32 h-32 text-amber-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 tracking-wider uppercase">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#FAFAFA]">{pendingTasks}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2 font-mono">{pendingTasks} scheduled for today</p>
        </div>

        {/* High Risk Card */}
        <div className="bg-[#09090B] border border-rose-900/30 bg-rose-900/5 p-5 rounded-2xl relative group overflow-hidden transition-all duration-200">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.02] group-hover:scale-110 transition-transform duration-300">
            <AlertTriangle className="w-32 h-32 text-rose-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 tracking-wider uppercase">High Risk</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-rose-500">{highPriorityPending}</span>
          </div>
          <p className="text-xs text-rose-400 mt-2 font-mono">Deadline conflicts detected</p>
        </div>

        {/* Completion Rate Card */}
        <div className="bg-[#09090B] border border-[#27272A] p-5 rounded-2xl relative group overflow-hidden transition-all duration-200 hover:border-zinc-700">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.02] group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="w-32 h-32 text-emerald-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 tracking-wider uppercase">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#FAFAFA]">{completionRate}%</span>
          </div>
          <p className="text-xs text-emerald-500 mt-2 font-mono">Velocity: {totalTasks > 0 ? (completedTasks / Math.max(1, totalTasks)).toFixed(1) : 0}/day</p>
        </div>
      </div>

      {/* Main Grid: Analytical Charts + Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workload Load Distribution Chart */}
        <div className="lg:col-span-2 bg-[#09090B] border border-[#27272A] rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#FAFAFA]">Performance Distribution</h3>
              <p className="text-xs text-zinc-400">Cognitive task workload structured by complexity parameters</p>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 font-semibold uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
              Active Registry
            </span>
          </div>
          
          <div className="h-64 mt-4 w-full">
            {totalTasks > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px' }}
                    labelClassName="text-[#FAFAFA] font-semibold text-xs"
                  />
                  <Bar dataKey="pending" name="Pending" fill="#eab308" radius={[4, 4, 0, 0]} barSize={36} />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs font-mono">
                No telemetry available. Populate task queue first.
              </div>
            )}
          </div>
        </div>

        {/* Core Task Timeline */}
        <div className="bg-[#09090B] border border-[#27272A] rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#FAFAFA]">Core Timeline</h3>
            <p className="text-xs text-zinc-400">Nearest deadlines calculated by the copilot engine</p>
          </div>

          <div className="mt-5 space-y-3 flex-1 overflow-y-auto">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-[#18181B] border border-[#27272A] p-4 rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group flex items-start gap-3"
                >
                  <button
                    onClick={() => onCompleteTask(task.id, true)}
                    className="mt-0.5 w-5 h-5 rounded border border-zinc-700 group-hover:border-indigo-500 flex items-center justify-center hover:bg-indigo-500/10 cursor-pointer"
                  >
                    <div className="w-1.5 h-1.5 bg-transparent group-hover:bg-indigo-400 rounded-sm"></div>
                  </button>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-zinc-200 block truncate leading-tight">
                      {task.title}
                    </span>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <span className={`text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border uppercase ${
                        task.priority === 'high' 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : task.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 flex items-center space-x-1">
                        <CalendarDays className="w-3 h-3 text-zinc-600 inline mr-0.5" />
                        <span>{new Date(task.deadline).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="w-8 h-8 text-zinc-700 mb-2 animate-bounce" />
                <span className="text-xs text-zinc-500 font-mono">Timeline is fully optimized!</span>
                <span className="text-[10px] text-zinc-600 mt-1">Ready for high-impact milestones</span>
              </div>
            )}
          </div>

          <button 
            onClick={() => setActiveTab('tasks')}
            className="w-full mt-4 py-2 bg-[#18181B] hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium border border-[#27272A] transition-colors cursor-pointer"
          >
            Manage Registry
          </button>
        </div>
      </div>
    </div>
  );
}
