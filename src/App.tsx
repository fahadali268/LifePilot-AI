import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  getDocFromServer
} from 'firebase/firestore';
import { db, DEFAULT_USER_ID } from './firebase/config';
import { Task } from './types';

// Page Imports
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TaskManagement from './pages/TaskManagement';
import AIAnalysis from './pages/AIAnalysis';
import SmartPlanner from './pages/SmartPlanner';
import AICoach from './pages/AICoach';
import Insights from './pages/Insights';

// Lucide icons for mobile burger nav
import { Menu, X, Terminal, Activity, Info, RotateCw } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: DEFAULT_USER_ID,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Quick notification dispatch helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Real-time Firestore Task listener
  useEffect(() => {
    testConnection();

    const pathForList = 'tasks';
    const tasksQuery = query(
      collection(db, pathForList),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        taskList.push({
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          deadline: data.deadline || '',
          priority: data.priority || 'medium',
          estimatedHours: Number(data.estimatedHours) || 1,
          completed: !!data.completed,
          createdAt: data.createdAt || new Date().toISOString(),
          completedAt: data.completedAt || undefined,
          userId: data.userId || DEFAULT_USER_ID,
        });
      });
      setTasks(taskList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, pathForList);
      setLoading(false);
      showToast("Sync failed: Check Firebase rules and connectivity.", "error");
    });

    return () => unsubscribe();
  }, []);

  // CRUD Trigger: Add Task
  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    const pathForAdd = 'tasks';
    try {
      const newDocRef = await addDoc(collection(db, pathForAdd), {
        ...taskData,
        createdAt: new Date().toISOString(),
        userId: DEFAULT_USER_ID,
      });
      showToast(`Task successfully registered: "${taskData.title}"`, 'success');
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, pathForAdd);
      showToast("Failed to register task in Firestore.", "error");
    }
  };

  // CRUD Trigger: Update Task
  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const pathForUpdate = `tasks/${id}`;
    try {
      const taskRef = doc(db, 'tasks', id);
      const dataToSave: any = { ...updates };
      if (updates.completed !== undefined) {
        dataToSave.completedAt = updates.completed ? new Date().toISOString() : null;
      }
      await updateDoc(taskRef, dataToSave);
      showToast(updates.completed !== undefined 
        ? updates.completed ? "Task milestone achieved! 🚀" : "Task marked as active."
        : "Task registry updated.", 'info');
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, pathForUpdate);
      showToast("Update transaction failed.", "error");
    }
  };

  // CRUD Trigger: Delete Task
  const handleDeleteTask = async (id: string) => {
    if (window.confirm("Confirm deletion of task from your registry?")) {
      const pathForDelete = `tasks/${id}`;
      try {
        await deleteDoc(doc(db, 'tasks', id));
        showToast("Task removed from registry.", 'info');
      } catch (e: any) {
        handleFirestoreError(e, OperationType.DELETE, pathForDelete);
        showToast("Delete transaction failed.", "error");
      }
    }
  };

  // Helper trigger to toggle completion status with appropriate type
  const handleCompleteTask = async (id: string, completed: boolean) => {
    await handleUpdateTask(id, { completed });
  };

  // Quick navigation helper to add tasks from other pages
  const handleTriggerNewTaskForm = () => {
    setActiveTab('tasks');
    showToast("Opening Tasks Registry form...", 'info');
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            tasks={tasks} 
            onAddTaskClick={handleTriggerNewTaskForm} 
            onCompleteTask={handleCompleteTask}
            setActiveTab={setActiveTab}
          />
        );
      case 'tasks':
        return (
          <TaskManagement 
            tasks={tasks} 
            onAddTask={handleAddTask} 
            onUpdateTask={handleUpdateTask} 
            onDeleteTask={handleDeleteTask}
          />
        );
      case 'analysis':
        return <AIAnalysis tasks={tasks} />;
      case 'planner':
        return <SmartPlanner tasks={tasks} onCompleteTask={handleCompleteTask} />;
      case 'coach':
        return <AICoach tasks={tasks} />;
      case 'insights':
        return <Insights tasks={tasks} />;
      default:
        return <Dashboard tasks={tasks} onAddTaskClick={handleTriggerNewTaskForm} onCompleteTask={handleCompleteTask} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col md:flex-row relative text-[#FAFAFA]">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl border shadow-2xl flex items-center space-x-3 text-xs font-semibold animate-fade-in bg-[#18181B] text-white border-[#27272A]">
          <Info className={`w-4 h-4 ${
            notification.type === 'success' 
              ? 'text-emerald-400' 
              : notification.type === 'error'
                ? 'text-rose-400'
                : 'text-indigo-400'
          }`} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Desktop Navbar Sidebar */}
      <div className="hidden md:block">
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          tasksCount={tasks.filter(t => !t.completed).length} 
        />
      </div>

      {/* Mobile Header Top-Bar */}
      <div className="md:hidden w-full bg-[#09090B] border-b border-[#27272A] p-4 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-white animate-pulse" />
          </div>
          <span className="font-display font-bold text-white text-sm">LifePilot AI</span>
        </div>

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 pt-16">
          <div className="bg-[#09090B] h-auto p-6 border-b border-[#27272A] space-y-4 shadow-2xl animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'tasks', label: 'Tasks' },
                { id: 'analysis', label: 'Scanner' },
                { id: 'planner', label: 'Planner' },
                { id: 'coach', label: 'AI Coach' },
                { id: 'insights', label: 'Insights' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveTab(m.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`py-3 px-4 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                    activeTab === m.id 
                      ? 'bg-zinc-800 border-zinc-700 text-white' 
                      : 'bg-[#18181B] border-[#27272A] text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 bg-zinc-800 text-zinc-400 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close Menu
            </button>
          </div>
        </div>
      )}

      {/* Primary Workspace Sandbox */}
      <main className="flex-1 overflow-x-hidden min-h-screen pb-12">
        {loading ? (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-[#09090B]">
            <RotateCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <span className="text-xs text-zinc-500 font-mono">Connecting to LifePilot Firestore core...</span>
          </div>
        ) : (
          renderActiveTabContent()
        )}
      </main>
    </div>
  );
}
