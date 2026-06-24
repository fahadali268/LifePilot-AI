import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Sparkles, 
  Calendar, 
  MessageSquare, 
  BarChart3,
  Activity,
  User,
  Compass
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tasksCount: number;
}

export default function Navbar({ activeTab, setActiveTab, tasksCount }: NavbarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks Registry', icon: CheckSquare, badge: tasksCount },
    { id: 'analysis', label: 'Risk Scanner', icon: Sparkles, highlight: true },
    { id: 'planner', label: 'Smart Planner', icon: Calendar },
    { id: 'coach', label: 'AI Coach', icon: MessageSquare },
    { id: 'insights', label: 'Insights & Score', icon: BarChart3 },
  ];

  return (
    <nav className="w-full md:w-64 bg-[#09090B] border-r border-[#27272A] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-10">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#27272A]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-white tracking-wide block">LifePilot AI</span>
            <span className="text-[10px] font-mono text-indigo-400 font-medium tracking-wider uppercase">Vibe2Ship Hackathon</span>
          </div>
        </div>
      </div>

      {/* Nav Menu Links */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <span className="px-3 text-[10px] font-bold text-zinc-500 tracking-wider uppercase block mb-3">Menu</span>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-[#18181B] text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'} ${item.highlight && !isActive ? 'text-purple-400 animate-pulse' : ''}`} />
                <span>{item.label}</span>
              </div>
              
              {/* Badge/Highlight Indicator */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-zinc-800 text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-700">
                  {item.badge}
                </span>
              )}
              {item.highlight && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 ring-2 ring-purple-400/30 animate-ping"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pilot Profile & Version */}
      <div className="p-4 border-t border-[#27272A] bg-zinc-900/20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
            <User className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-zinc-200 block truncate">Hackathon Pilot</span>
            <span className="text-[9px] font-mono text-zinc-500 block truncate">gen-pilot@hack.io</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono text-indigo-400 font-medium bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-800">v1.2.0</span>
        </div>
      </div>
    </nav>
  );
}
