export const VIEW_TYPE_TODO = 'enhanced-todo-view';
export const PLUGIN_NAME = 'Enhanced Todo';

// Priority system constants
export enum TaskPriority {
  A = 'A', // 1h:2tasks = 30min each
  B = 'B', // 2h:4tasks = 30min each  
  C = 'C', // 1h:6tasks = 10min each
  D = 'D'  // 1h:1task = 60min each
}

export enum TodoItemStatus {
  Todo,
  Done,
}

// Time allocation ratios
export interface TimeAllocationRatio {
  hoursBlock: number;
  tasksInBlock: number;
  timePerTask: number;
}

export const PRIORITY_TIME_RATIOS: Record<TaskPriority, TimeAllocationRatio> = {
  [TaskPriority.A]: { hoursBlock: 1, tasksInBlock: 2, timePerTask: 30 }, // 30min each
  [TaskPriority.B]: { hoursBlock: 2, tasksInBlock: 4, timePerTask: 30 }, // 30min each
  [TaskPriority.C]: { hoursBlock: 1, tasksInBlock: 6, timePerTask: 10 }, // 10min each
  [TaskPriority.D]: { hoursBlock: 1, tasksInBlock: 1, timePerTask: 60 }  // 60min each
};

// Auto-priority thresholds
export const AUTO_PRIORITY_THRESHOLDS = {
  PRIORITY_A: 6, // 6+ subtasks
  PRIORITY_B: 4, // 4+ subtasks
  PRIORITY_C: 2, // 2+ subtasks
  PRIORITY_D: 0  // 0-1 subtasks
};

// Reschedule warning threshold
export const RESCHEDULE_WARNING_THRESHOLD = 3;

// Task breakdown analysis
export enum TaskSuitabilityIssueType {
  TOO_COMPLEX = 'TOO_COMPLEX',
  INCONSISTENT_COMPLEXITY = 'INCONSISTENT_COMPLEXITY',
  TIME_MISMATCH = 'TIME_MISMATCH'
}

export enum IssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum RecommendedAction {
  BREAK_DOWN_REQUIRED = 'required',
  BREAK_DOWN_SUGGESTED = 'suggested',
  NO_ACTION_NEEDED = 'none'
}

// Task breakdown suggestion interface
export interface TaskBreakdownSuggestion {
  title: string;
  priority: TaskPriority;
  estimatedTime: number;
  reasoning: string;
  subtasks: string[];
}
