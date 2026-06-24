export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO String (YYYY-MM-DD or date-time)
  priority: Priority;
  estimatedHours: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  userId: string;
}

export interface DeadlineConflict {
  taskIds: string[];
  reason: string;
}

export interface AIAnalysis {
  highestRiskTaskId: string | null;
  highestRiskReason: string;
  deadlineConflicts: DeadlineConflict[];
  workloadIssues: string;
  suggestedOrder: string[]; // Array of Task IDs in order
  analyzedAt: string;
}

export interface ScheduleItem {
  taskId: string | null; // Null if it's a break or rest or general routine
  customActivity: string | null; // Description of activity if taskId is null
  duration: string; // e.g. "2 hours" or "30 mins"
  timeSlot: string; // e.g. "09:00 AM - 11:00 AM"
}

export interface SmartPlan {
  morning: ScheduleItem[];
  afternoon: ScheduleItem[];
  evening: ScheduleItem[];
  night: ScheduleItem[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
