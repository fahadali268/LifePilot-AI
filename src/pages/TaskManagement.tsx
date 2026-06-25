import React, { useState } from 'react';
import { Task, Priority } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Filter, 
  X,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface TaskManagementProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskManagement({ tasks, onAddTask, onUpdateTask, onDeleteTask }: TaskManagementProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [formError, setFormError] = useState<string | null>(null);

  // Open modal for creating a new task
  const handleNewTaskClick = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setDeadline(new Date().toISOString().split('T')[0]);
    setPriority('medium');
    setEstimatedHours(2);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing an existing task
  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setDeadline(task.deadline);
    setPriority(task.priority);
    setEstimatedHours(task.estimatedHours);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Task title is required.");
      return;
    }

    if (!deadline) {
      setFormError("Deadline is required.");
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (deadline < todayStr && !editingTask) {
      setFormError("Deadline cannot be in the past.");
      return;
    }

    const hours = Number(estimatedHours);
    if (isNaN(hours) || hours <= 0) {
      setFormError("Estimated hours must be a positive number greater than 0.");
      return;
    }

    if (hours > 100) {
      setFormError("Estimated hours cannot exceed 100 hours per single task block.");
      return;
    }

    // Check for duplicate task titles (to avoid duplicate clicks or entries)
    const isDuplicate = tasks.some(t => 
      t.title.trim().toLowerCase() === title.trim().toLowerCase() && 
      (!editingTask || t.id !== editingTask.id)
    );

    if (isDuplicate) {
      setFormError("A task with this title already exists in your registry.");
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      deadline,
      priority,
      estimatedHours: hours,
      completed: editingTask ? editingTask.completed : false,
    };

    if (editingTask) {
      onUpdateTask(editingTask.id, taskData);
    } else {
      onAddTask(taskData);
    }

    setIsModalOpen(false);
  };

  // Filter tasks based on status, priority and search queries
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = 
      filter === 'all' || 
      (filter === 'pending' && !task.completed) || 
      (filter === 'completed' && task.completed);

    const matchesPriority = 
      priorityFilter === 'all' || 
      task.priority === priorityFilter;

    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Tasks Registry</h1>
          <p className="text-sm text-zinc-400">Deploy, mutate, and manage active tasks securely synchronized with Firestore</p>
        </div>
        <button
          onClick={handleNewTaskClick}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center space-x-2 shadow-lg shadow-indigo-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task to Registry</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter buttons */}
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono border transition-all cursor-pointer ${
              filter === 'all' 
                ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400' 
                : 'bg-[#09090B] border-[#27272A] text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono border transition-all cursor-pointer ${
              filter === 'pending' 
                ? 'bg-amber-600/15 border-amber-500 text-amber-400' 
                : 'bg-[#09090B] border-[#27272A] text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            Pending ({tasks.filter(t => !t.completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono border transition-all cursor-pointer ${
              filter === 'completed' 
                ? 'bg-emerald-600/15 border-emerald-500 text-emerald-400' 
                : 'bg-[#09090B] border-[#27272A] text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            Completed ({tasks.filter(t => t.completed).length})
          </button>

          <span className="h-6 w-[1px] bg-[#27272A] mx-1 hidden sm:block"></span>

          {/* Priority filter selector */}
          <div className="flex items-center space-x-1">
            <Filter className="w-3 h-3 text-zinc-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-[#09090B] border border-[#27272A] hover:border-zinc-700 rounded-lg text-xs px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </span>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div 
              key={task.id}
              className={`bg-[#09090B] border rounded-xl p-5 hover:border-zinc-700 transition-all duration-300 flex flex-col justify-between ${
                task.completed ? 'border-emerald-500/20 bg-[#18181B]/70' : 'border-[#27272A]'
              }`}
            >
              <div>
                {/* Header: Priority & Action buttons */}
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded uppercase border ${
                    task.priority === 'high' 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                      : task.priority === 'medium'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {task.priority} Priority
                  </span>
                  
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleEditClick(task)}
                      className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 rounded transition-colors cursor-pointer"
                      title="Edit task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="mt-3.5">
                  <h3 className={`font-semibold text-sm leading-tight transition-all ${
                    task.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'
                  }`}>
                    {task.title}
                  </h3>
                  <p className={`text-xs mt-1.5 line-clamp-3 leading-relaxed ${
                    task.completed ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
                    {task.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Footer: Metadata & Complete switch */}
              <div className="mt-5 pt-4 border-t border-[#27272A] flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center text-[10px] text-zinc-500 font-mono">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-zinc-600" />
                    <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-[10px] text-zinc-500 font-mono">
                    <Clock className="w-3.5 h-3.5 mr-1 text-zinc-600" />
                    <span>Est: {task.estimatedHours}h</span>
                  </div>
                </div>

                <button
                  onClick={() => onUpdateTask(task.id, { completed: !task.completed })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center space-x-1.5 transition-all ${
                    task.completed 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {task.completed ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <span>Complete</span>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-[#09090B] border border-[#27272A] rounded-xl p-12 text-center flex flex-col items-center justify-center">
            <BookOpen className="w-12 h-12 text-zinc-700 mb-3 animate-pulse" />
            <span className="text-sm font-semibold text-zinc-300">No matching tasks found</span>
            <span className="text-xs text-zinc-500 max-w-sm mt-1">Adjust your filter values, clear your search query, or deploy a new task to your registry to get started.</span>
            <button
              onClick={handleNewTaskClick}
              className="mt-4 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-400 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Add Your First Task
            </button>
          </div>
        )}
      </div>

      {/* Task Create/Edit Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#09090B] border border-[#27272A] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-5 border-b border-[#27272A] flex items-center justify-between bg-zinc-900/10">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-base font-semibold text-white font-display">
                  {editingTask ? 'Modify Task' : 'Register New Task'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider mb-1.5">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optimize Database Indexes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Audit all table indices and formulate missing foreign keys..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {/* Grid: Deadline + Est Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider mb-1.5">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider mb-1.5">Estimated Hours</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Priority Select */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider mb-1.5 font-display">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        priority === p 
                          ? p === 'high'
                            ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                            : p === 'medium'
                              ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                              : 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                          : 'bg-[#09090B] border border-[#27272A] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center space-x-2 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-3 border-t border-[#27272A] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/15 transition-colors cursor-pointer"
                >
                  {editingTask ? 'Save Registry' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
