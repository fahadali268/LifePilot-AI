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

// 1. Task analysis API endpoint
app.post('/api/analyze', async (req, res) => {
  const { tasks } = req.body;
  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Tasks list is required and must be an array' });
  }

  try {
    const ai = getGeminiClient();
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
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
    const ai = getGeminiClient();
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
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

  try {
    const ai = getGeminiClient();
    
    // Create system instructions for conversational coach
    const systemInstruction = `You are LifePilot AI, a brilliant Staff Productivity Engineer and elite Executive Performance Coach.
Your tone is encouraging, objective, energetic, and completely focused on smart task execution.
You hate default productivity advice (e.g., "just work harder"). Instead, analyze deadline clusters, workload fatigue, and estimate gaps.
Always offer structured, actionable strategies. Recommend tasks by name from the user's workspace list when relevant.

Here is the user's active task list from Firestore:
${JSON.stringify(tasks, null, 2)}

Provide helpful Markdown responses. Keep answers relatively concise and highly punchy.`;

    // Construct contents array with chat history
    const contents: any[] = [];
    
    // Append context and system instructions inside the chat prompt
    contents.push({
      role: 'user',
      parts: [{ text: `${systemInstruction}\n\nUser Message: ${message}` }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
    });

    return res.json({
      text: response.text || "I'm listening, but I had an issue generating a response. Tell me more about your workspace setup."
    });

  } catch (error: any) {
    console.warn('Using simulation fallback for chat endpoint due to:', error.message || error);
    
    // Handle mock conversations realistically
    const text = message.toLowerCase();
    let reply = "";

    if (text.includes('hello') || text.includes('hi')) {
      reply = `Hello! I'm your **LifePilot AI Productivity Coach**. 🚀\n\nI've analyzed your Firestore workspace. You currently have **${tasks?.length || 0} tasks** loaded. What's the biggest bottleneck on your mind right now? Let's de-risk your day.`;
    } else if (text.includes('deadline') || text.includes('due') || text.includes('tomorrow')) {
      const urgentTasks = tasks?.filter((t: any) => !t.completed && t.priority === 'high') || [];
      if (urgentTasks.length > 0) {
        reply = `I see you have **${urgentTasks.length} high-priority tasks** pending. \n\nMy recommendations:\n1. **Focus on: "${urgentTasks[0].title}"** first thing tomorrow. It carries the highest risk factor.\n2. Apply a **90-minute Deep Work sprint** (no phone, no Slack).\n3. Delegate or reschedule minor activities to free up bandwidth. Let me know if you want me to write a schedule block for this!`;
      } else {
        reply = `You don't have any pressing high-priority deadlines for tomorrow! This is a perfect window to batch smaller operational tasks or invest in creative strategic work. What would you like to plan?`;
      }
    } else if (text.includes('burnout') || text.includes('tired') || text.includes('overwhelmed')) {
      reply = `I hear you. Workload fatigue is a leading productivity killer. Let's practice **Workload Defense**:\n\n*   **Step 1**: Freeze all low-priority tasks today. Only look at high-priority items.\n*   **Step 2**: Reduce task estimates by 20% or extend deadlines by 24 hours where safe.\n*   **Step 3**: Introduce a strict "shutdown ritual" at 6 PM. No screens after that.\n\nWould you like me to reschedule your day to create more recovery periods?`;
    } else {
      reply = `That's an excellent point. Looking at your current task registry with **${tasks?.length || 0} active items**, the best course of action is to align tasks into dedicated focus categories.\n\nHere is a quick sprint tactic:\n*   **Batching**: Group similar cognitive tasks together.\n*   **Urgency Sorting**: Execute "${tasks?.[0]?.title || 'your first task'}" as an anchor milestone.\n\nTell me more about how you want to tackle this, or ask me to "Generate a Smart Plan" on the Planner tab!`;
    }

    return res.json({
      text: `*(Simulated Coach Mode)*\n\n${reply}`
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
