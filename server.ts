import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily to handle missing key gracefully
let aiClient: GoogleGenAI | null = null;
const getGeminiClient = (): GoogleGenAI => {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
      console.warn('⚠️ GEMINI_API_KEY is not set or holds default value. Running in fallback simulation mode.');
      throw new Error('GEMINI_API_KEY is missing');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
};

// Helper to clean JSON response from Gemini
const cleanJSON = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

// Resilient content generation helper with model fallback and retries
async function generateContentWithRetry(
  contents: any,
  systemInstruction?: string
): Promise<string> {
  const ai = getGeminiClient();
  const modelsToTry = ['gemini-3.5-flash', 'gemini-2.5-flash'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let attempts = 0;
    while (attempts < 2) {
      try {
        console.log(`[Gemini API] Requesting ${model} (attempt ${attempts + 1})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: systemInstruction ? { systemInstruction } : undefined,
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        attempts++;
        lastError = err;
        console.warn(`[Gemini API] ${model} attempt ${attempts} failed:`, err?.message || err);
      }
    }
  }

  throw lastError || new Error('All Gemini API generation attempts failed.');
}

// 1. Task analysis API endpoint
app.post('/api/analyze', async (req, res) => {
  const { tasks } = req.body;
  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Tasks list is required and must be an array' });
  }

  try {
    const prompt = `Analyze these tasks for risk, deadline conflicts, and priority.
Return ONLY a valid JSON object matching this TypeScript interface. Do NOT include markdown code blocks, formatting, or conversational text. Return just the JSON:

interface DeadlineConflict {
  taskIds: string[];
  reason: string;
}

interface AIAnalysis {
  highestRiskTaskId: string | null;
  highestRiskReason: string;
  deadlineConflicts: DeadlineConflict[];
  workloadIssues: string;
  suggestedOrder: string[]; // Array of task IDs in the recommended order of completion
}

Here are the user's tasks:
${JSON.stringify(tasks, null, 2)}`;

    const responseText = await generateContentWithRetry(prompt);
    const cleanedJson = cleanJSON(responseText);
    
    try {
      const parsed = JSON.parse(cleanedJson);
      return res.json(parsed);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', responseText, parseError);
      return res.status(500).json({
        error: 'AI generated invalid JSON structure. Retrying or fallback might be needed.',
        rawResponse: responseText
      });
    }

  } catch (error: any) {
    console.warn('Using simulation fallback for analyze endpoint due to:', error.message || error);
    
    // Fallback simulation mode
    if (tasks.length === 0) {
      return res.json({
        highestRiskTaskId: null,
        highestRiskReason: "No active tasks found. Add a task to initiate agentic risk analysis.",
        deadlineConflicts: [],
        workloadIssues: "Workload is currently clear. Add tasks to calculate load factors.",
        suggestedOrder: [],
        analyzedAt: new Date().toISOString()
      });
    }

    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && !t.completed);
    const highestRisk = highPriorityTasks[0] || tasks.find(t => !t.completed) || tasks[0];
    const conflicts = [];
    
    // Simple mock detection for conflicts
    if (tasks.filter(t => !t.completed).length > 2) {
      conflicts.push({
        taskIds: tasks.slice(0, 2).map(t => t.id),
        reason: "Multiple deadlines clustered within the same 48-hour window. Consider dispersing effort."
      });
    }

    const suggestedOrder = [...tasks]
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const weightA = priorityWeight[a.priority] || 0;
        const weightB = priorityWeight[b.priority] || 0;
        return weightB - weightA || new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
      .map(t => t.id);

    return res.json({
      highestRiskTaskId: highestRisk ? highestRisk.id : null,
      highestRiskReason: highestRisk 
        ? `[SIMULATED] "${highestRisk.title}" has a high urgency and complexity score relative to estimated hours (${highestRisk.estimatedHours}h).`
        : "No active tasks found.",
      deadlineConflicts: conflicts,
      workloadIssues: tasks.length > 4 
        ? `[SIMULATED] Workload density is high. You have ${tasks.length} active tasks totaling ${tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)} hours. Schedule deep work intervals.`
        : "[SIMULATED] Workload looks balanced. Keep up the steady momentum!",
      suggestedOrder,
      analyzedAt: new Date().toISOString(),
      isSimulated: true
    });
  }
});

// 2. Smart Planner API endpoint
app.post('/api/plan', async (req, res) => {
  const { tasks } = req.body;
  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Tasks list is required and must be an array' });
  }

  try {
    const prompt = `Generate a highly optimized, actionable daily schedule structured into Morning, Afternoon, Evening, and Night segments.
Map the user's active tasks to the schedule logically based on deadlines, effort hours, and priority. Ensure breaks, reviews, or mindfulness exercises are integrated as filler slots if there are empty intervals.

Return ONLY a valid JSON object matching this TypeScript interface. Do NOT include markdown blocks or extra text:

interface ScheduleItem {
  taskId: string | null; // ID of the task scheduled. Set to null if it is a rest, break, routine exercise, or placeholder.
  customActivity: string | null; // Plain text description (e.g. "Focus Warm-up", "Deep Sleep & Wind Down", "Coffee Break") if taskId is null. Otherwise null.
  duration: string; // e.g., "1.5 hours", "30 mins"
  timeSlot: string; // e.g., "09:00 AM - 10:30 AM"
}

interface SmartPlan {
  morning: ScheduleItem[];
  afternoon: ScheduleItem[];
  evening: ScheduleItem[];
  night: ScheduleItem[];
}

User Tasks:
${JSON.stringify(tasks, null, 2)}`;

    const responseText = await generateContentWithRetry(prompt);
    const cleanedJson = cleanJSON(responseText);
    
    try {
      const parsed = JSON.parse(cleanedJson);
      return res.json(parsed);
    } catch (parseError) {
      console.error('Failed to parse Gemini schedule JSON response:', responseText, parseError);
      return res.status(500).json({
        error: 'AI generated invalid schedule JSON structure.',
        rawResponse: responseText
      });
    }

  } catch (error: any) {
    console.warn('Using simulation fallback for plan endpoint due to:', error.message || error);

    // Fallback simulation schedule builder
    const activeTasks = tasks.filter(t => !t.completed);
    
    const morningItems: any[] = [
      { taskId: null, customActivity: "Energy Routine & AI Day Review", duration: "30 mins", timeSlot: "08:00 AM - 08:30 AM" }
    ];
    const afternoonItems: any[] = [];
    const eveningItems: any[] = [];
    const nightItems: any[] = [
      { taskId: null, customActivity: "Reflective Day Journaling & Deep Sleep prep", duration: "1 hour", timeSlot: "10:00 PM - 11:00 PM" }
    ];

    if (activeTasks.length > 0) {
      // Map tasks across the slots
      activeTasks.forEach((task, idx) => {
        const slotTask = {
          taskId: task.id,
          customActivity: null,
          duration: `${task.estimatedHours || 1} hour(s)`,
          timeSlot: ""
        };

        if (idx === 0) {
          slotTask.timeSlot = "09:00 AM - 11:00 AM";
          morningItems.push(slotTask);
        } else if (idx === 1) {
          slotTask.timeSlot = "01:30 PM - 03:00 PM";
          afternoonItems.push(slotTask);
        } else if (idx === 2) {
          slotTask.timeSlot = "04:00 PM - 05:30 PM";
          afternoonItems.push(slotTask);
        } else if (idx === 3) {
          slotTask.timeSlot = "07:00 PM - 08:30 PM";
          eveningItems.push(slotTask);
        } else {
          slotTask.timeSlot = "09:00 PM - 09:45 PM";
          nightItems.unshift(slotTask);
        }
      });
    } else {
      morningItems.push({ taskId: null, customActivity: "Creative Brainstorming Session", duration: "2 hours", timeSlot: "09:00 AM - 11:00 AM" });
      afternoonItems.push({ taskId: null, customActivity: "Skills Study & Documentation Catch-up", duration: "1.5 hours", timeSlot: "02:00 PM - 03:30 PM" });
      eveningItems.push({ taskId: null, customActivity: "Physical Recreation & Walk", duration: "1 hour", timeSlot: "06:00 PM - 07:00 PM" });
    }

    // Fill missing lists
    if (afternoonItems.length === 0) {
      afternoonItems.push({ taskId: null, customActivity: "Focused Workspace Review", duration: "1 hour", timeSlot: "02:00 PM - 03:00 PM" });
    }
    if (eveningItems.length === 0) {
      eveningItems.push({ taskId: null, customActivity: "Personal Project Sandbox", duration: "1.5 hours", timeSlot: "07:30 PM - 09:00 PM" });
    }

    return res.json({
      morning: morningItems,
      afternoon: afternoonItems,
      evening: eveningItems,
      night: nightItems,
      createdAt: new Date().toISOString(),
      isSimulated: true
    });
  }
});

// 3. AI Coach chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history, tasks } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // 1. Prepare system instruction with the real active tasks context
  const systemInstruction = `You are LifePilot AI, a brilliant Staff Productivity Engineer and elite Executive Performance Coach.
Your tone is encouraging, objective, energetic, and completely focused on smart task execution.
You hate generic, cliché productivity advice. Instead, analyze real deadline clusters, workload fatigue, and estimate gaps.
Always offer structured, actionable strategies. Recommend tasks by name from the user's workspace list when relevant.

Here is the user's active task registry containing deadlines, priorities, and completion status:
${JSON.stringify(tasks || [], null, 2)}

Provide helpful, structured Markdown responses. Keep answers concise, actionable, and punchy.`;

  // 2. Build contents array representing conversation history
  const contents: any[] = [];
  
  if (history && Array.isArray(history)) {
    history.forEach((msg: any) => {
      const role = msg.sender === 'assistant' ? 'model' : 'user';
      contents.push({
        role: role,
        parts: [{ text: msg.text }]
      });
    });

    // Verify if the current user message is already the last message in history
    const lastHistoryMsg = history.length > 0 ? history[history.length - 1] : null;
    const isCurrentMsgInHistory = lastHistoryMsg && lastHistoryMsg.text === message;
    if (!isCurrentMsgInHistory) {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });
  }

  // 3. Request generation from Gemini with fallback and retries
  try {
    const responseText = await generateContentWithRetry(contents, systemInstruction);
    return res.json({
      text: responseText
    });
  } catch (apiError: any) {
    console.error('All Gemini API attempts failed:', apiError);
    return res.status(500).json({
      error: `Gemini API connection failed after retry: ${apiError?.message || apiError}`
    });
  }
});

// Setup Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production static server configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 LifePilot AI server booting at http://localhost:${PORT}`);
  });
}

startServer();
