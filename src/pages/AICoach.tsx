import React, { useState, useEffect, useRef } from 'react';
import { Task, ChatMessage } from '../types';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Sparkles, 
  Activity, 
  Bot, 
  User,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db, DEFAULT_USER_ID } from '../firebase/config';
import Markdown from '../components/Markdown';

interface AICoachProps {
  tasks: Task[];
}

export default function AICoach({ tasks }: AICoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch cached chat history from Firestore on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const cachedDoc = await getDoc(doc(db, 'chat_history', DEFAULT_USER_ID));
        if (cachedDoc.exists()) {
          setMessages(cachedDoc.data().messages || []);
        } else {
          // Pre-populate with welcome message from AI
          const welcomeMessage: ChatMessage = {
            id: 'welcome',
            sender: 'assistant',
            text: `Welcome to **LifePilot AI Coaching Workspace**! 🚀\n\nI have fully loaded your active task registry containing **${tasks.length} task(s)**. I'm here as your Senior Productivity Engineer and performance strategist.\n\nAsk me anything! For example: \n* *"I feel overwhelmed. How should I prioritize today's tasks?"*\n* *"Can you write a detailed 90-minute focus sprint plan for my top task?"*\n* *"How do I design a defense ritual to avoid missing my upcoming deadlines?"*`,
            timestamp: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
          await setDoc(doc(db, 'chat_history', DEFAULT_USER_ID), { messages: [welcomeMessage] });
        }
      } catch (e) {
        console.warn('Failed to fetch chat history', e);
      }
    };
    fetchChatHistory();
  }, [tasks.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: inputText,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          history: updatedMessages.slice(-8), // Send last 8 messages for context
          tasks // Send current task context
        })
      });

      if (!response.ok) {
        throw new Error('AI Coach is temporarily offline. Please retry.');
      }

      const result = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: result.text || "I processed your request, but was unable to formulate coaching notes. Let's try restructuring.",
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      // Save to Firestore
      await setDoc(doc(db, 'chat_history', DEFAULT_USER_ID), { messages: finalMessages });

    } catch (err: any) {
      setError(err.message || "An error occurred during conversational generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear your coaching workspace history?")) {
      const welcome: ChatMessage = {
        id: 'welcome',
        sender: 'assistant',
        text: `Coaching registry cleared. Active tasks: **${tasks.length}**. What strategy shall we develop next?`,
        timestamp: new Date().toISOString()
      };
      try {
        setMessages([welcome]);
        await setDoc(doc(db, 'chat_history', DEFAULT_USER_ID), { messages: [welcome] });
      } catch (e) {
        setError('Unable to persist the cleared chat history right now.');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 h-[calc(100vh-64px)] md:h-screen flex flex-col justify-between">
      {/* Workspace Header */}
      <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4 flex items-center justify-between shrink-0 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20 text-purple-400">
            <Bot className="w-5 h-5 animate-pulse text-purple-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none font-display">Performance Coaching Workspace</h1>
            <span className="text-[10px] text-zinc-400 font-mono flex items-center space-x-1.5 mt-1">
              <Activity className="w-3 h-3 text-emerald-400 inline" />
              <span>Full registry context active ({tasks.length} tasks synced)</span>
            </span>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          title="Clear Conversation History"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Sandbox (Scroll Container) */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 select-text">
        {messages.map((msg) => {
          const isAI = msg.sender === 'assistant';
          return (
            <div 
              key={msg.id}
              className={`flex items-start gap-3.5 max-w-[85%] ${
                isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              {/* Profile Avatar */}
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                isAI 
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}>
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`rounded-2xl p-4 border text-xs leading-relaxed space-y-2 shadow-lg ${
                isAI 
                  ? 'bg-[#18181B] border-[#27272A] text-zinc-200' 
                  : 'bg-zinc-800 border-zinc-700 text-white'
              }`}>
                {isAI ? <Markdown content={msg.text} /> : <div className="whitespace-pre-line">{msg.text}</div>}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3.5 max-w-[80%] mr-auto">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <RotateCw className="w-4 h-4 animate-spin text-purple-400" />
            </div>
            <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 text-xs text-zinc-400 font-mono animate-pulse">
              Formulating coaching response and task cross-referencing...
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs max-w-md mx-auto">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="bg-[#09090B] border border-[#27272A] rounded-xl p-2 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={loading ? "AI is processing..." : "Ask your performance pilot assistant..."}
          disabled={loading}
          className="flex-1 bg-transparent px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-0 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className={`p-2.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            !inputText.trim() || loading
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
