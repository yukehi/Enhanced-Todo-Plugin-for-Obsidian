import { DateTime } from 'luxon';
import { TaskPriority, TodoItemStatus } from '../constants';

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  parentTaskId: string;
  complexity: number; // 1-5 scale
}

export interface RescheduleEvent {
  date: DateTime;
  reason: string;
  fromDate: DateTime;
  toDate: DateTime;
}

export interface TaskSuitabilityIssue {
  type: 'TOO_COMPLEX' | 'INCONSISTENT_COMPLEXITY' | 'TIME_MISMATCH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  suggestion: string;
}

export interface TaskSuitabilityResult {
  isProblematic: boolean;
  issues: TaskSuitabilityIssue[];
  recommendedAction: 'required' | 'suggested' | 'none';
}

export class EnhancedTodoItem {
  public id: string;
  public title: string;
  public description: string;
  
  // Priority and time management
  public priority: TaskPriority;
  public subtasks: SubTask[];
  public subtaskCount: number;
  public isAutoPriority: boolean; // true if auto-assigned, false if manually set
  public allocatedTime: number; // in minutes
  public remainingTime: number; // in minutes
  public estimatedTime: number; // user's original estimate
  
  // Scheduling & tracking
  public assignedDate?: DateTime;
  public originalAssignedDate?: DateTime;
  public rescheduleCount: number;
  public rescheduleHistory: RescheduleEvent[];
  public isAssignedToday: boolean;
  public needsRescheduleWarning: boolean;
  
  // Parent/child relationships
  public parentTaskId?: string;
  public childTaskIds: string[];
  public tags: string[];
  
  // Status & metadata
  public status: TodoItemStatus;
  public isCompleted: boolean;
  public completedDate?: DateTime;
  public createdDate: DateTime;
  public sourceFilePath: string;
  public lineNumber: number;
  public startIndex: number;
  public length: number;
  
  // Daily management
  public dayEndStatus?: 'completed' | 'forgotten' | 'rescheduled';
  
  // Task breakdown analysis
  public suitabilityAnalysis?: TaskSuitabilityResult;
  public lastAnalyzedDate?: DateTime;

  constructor(
    id: string,
    title: string,
    description: string,
    priority: TaskPriority,
    sourceFilePath: string,
    lineNumber: number,
    startIndex: number,
    length: number,
    status: TodoItemStatus = TodoItemStatus.Todo,
    subtasks: SubTask[] = [],
    isAutoPriority: boolean = true
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.subtasks = subtasks;
    this.subtaskCount = subtasks.length;
    this.isAutoPriority = isAutoPriority;
    this.sourceFilePath = sourceFilePath;
    this.lineNumber = lineNumber;
    this.startIndex = startIndex;
    this.length = length;
    this.status = status;
    
    // Initialize time management
    this.allocatedTime = this.calculateAllocatedTime();
    this.remainingTime = this.allocatedTime;
    this.estimatedTime = this.allocatedTime;
    
    // Initialize scheduling
    this.rescheduleCount = 0;
    this.rescheduleHistory = [];
    this.isAssignedToday = false;
    this.needsRescheduleWarning = false;
    
    // Initialize relationships
    this.childTaskIds = [];
    this.tags = [];
    
    // Initialize status
    this.isCompleted = status === TodoItemStatus.Done;
    this.createdDate = DateTime.now();
  }

  private calculateAllocatedTime(): number {
    const timeRatios = {
      [TaskPriority.A]: 30,
      [TaskPriority.B]: 30,
      [TaskPriority.C]: 10,
      [TaskPriority.D]: 60
    };
    return timeRatios[this.priority];
  }

  // Update priority and recalculate time allocation
  public updatePriority(newPriority: TaskPriority, isManual: boolean = false): void {
    this.priority = newPriority;
    this.isAutoPriority = !isManual;
    this.allocatedTime = this.calculateAllocatedTime();
    this.remainingTime = this.allocatedTime;
  }

  // Add a reschedule event
  public addRescheduleEvent(fromDate: DateTime, toDate: DateTime, reason: string): void {
    this.rescheduleHistory.push({
      date: DateTime.now(),
      reason,
      fromDate,
      toDate
    });
    this.rescheduleCount++;
    this.needsRescheduleWarning = this.rescheduleCount >= 3;
    this.assignedDate = toDate;
    this.isAssignedToday = toDate.hasSame(DateTime.now(), 'day');
  }

  // Mark task as completed
  public markCompleted(): void {
    this.status = TodoItemStatus.Done;
    this.isCompleted = true;
    this.completedDate = DateTime.now();
    this.remainingTime = 0;
  }

  // Mark task as todo
  public markTodo(): void {
    this.status = TodoItemStatus.Todo;
    this.isCompleted = false;
    this.completedDate = undefined;
    this.remainingTime = this.allocatedTime;
  }

  // Add subtask
  public addSubtask(title: string, complexity: number = 1): SubTask {
    const subtask: SubTask = {
      id: `${this.id}_sub_${this.subtasks.length}`,
      title,
      isCompleted: false,
      parentTaskId: this.id,
      complexity
    };
    
    this.subtasks.push(subtask);
    this.subtaskCount = this.subtasks.length;
    
    return subtask;
  }

  // Remove subtask
  public removeSubtask(subtaskId: string): boolean {
    const index = this.subtasks.findIndex(st => st.id === subtaskId);
    if (index !== -1) {
      this.subtasks.splice(index, 1);
      this.subtaskCount = this.subtasks.length;
      return true;
    }
    return false;
  }

  // Get completion percentage
  public getCompletionPercentage(): number {
    if (this.subtasks.length === 0) {
      return this.isCompleted ? 100 : 0;
    }
    
    const completedSubtasks = this.subtasks.filter(st => st.isCompleted).length;
    return Math.round((completedSubtasks / this.subtasks.length) * 100);
  }

  // Check if task is overdue
  public isOverdue(): boolean {
    if (!this.assignedDate) return false;
    return this.assignedDate < DateTime.now() && !this.isCompleted;
  }

  // Get days until due date
  public getDaysUntilDue(): number | null {
    if (!this.assignedDate) return null;
    return Math.ceil(this.assignedDate.diff(DateTime.now(), 'days').days);
  }

  // Assign to today
  public assignToToday(): void {
    this.assignedDate = DateTime.now().startOf('day');
    this.isAssignedToday = true;
    if (!this.originalAssignedDate) {
      this.originalAssignedDate = this.assignedDate;
    }
  }

  // Assign to specific date
  public assignToDate(date: DateTime): void {
    this.assignedDate = date.startOf('day');
    this.isAssignedToday = date.hasSame(DateTime.now(), 'day');
    if (!this.originalAssignedDate) {
      this.originalAssignedDate = this.assignedDate;
    }
  }

  // Get display priority with auto indicator
  public getDisplayPriority(): string {
    return this.isAutoPriority ? `${this.priority}🤖` : `${this.priority}📝`;
  }

  // Convert to JSON for storage
  public toJSON(): any {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      priority: this.priority,
      subtasks: this.subtasks,
      subtaskCount: this.subtaskCount,
      isAutoPriority: this.isAutoPriority,
      allocatedTime: this.allocatedTime,
      remainingTime: this.remainingTime,
      estimatedTime: this.estimatedTime,
      assignedDate: this.assignedDate?.toISO(),
      originalAssignedDate: this.originalAssignedDate?.toISO(),
      rescheduleCount: this.rescheduleCount,
      rescheduleHistory: this.rescheduleHistory.map(event => ({
        ...event,
        date: event.date.toISO(),
        fromDate: event.fromDate.toISO(),
        toDate: event.toDate.toISO()
      })),
      isAssignedToday: this.isAssignedToday,
      needsRescheduleWarning: this.needsRescheduleWarning,
      parentTaskId: this.parentTaskId,
      childTaskIds: this.childTaskIds,
      tags: this.tags,
      status: this.status,
      isCompleted: this.isCompleted,
      completedDate: this.completedDate?.toISO(),
      createdDate: this.createdDate.toISO(),
      sourceFilePath: this.sourceFilePath,
      lineNumber: this.lineNumber,
      startIndex: this.startIndex,
      length: this.length,
      dayEndStatus: this.dayEndStatus
    };
  }

  // Create from JSON
  public static fromJSON(data: any): EnhancedTodoItem {
    const item = new EnhancedTodoItem(
      data.id,
      data.title,
      data.description,
      data.priority,
      data.sourceFilePath,
      data.lineNumber,
      data.startIndex,
      data.length,
      data.status,
      data.subtasks || [],
      data.isAutoPriority
    );

    // Restore dates
    if (data.assignedDate) {
      item.assignedDate = DateTime.fromISO(data.assignedDate);
    }
    if (data.originalAssignedDate) {
      item.originalAssignedDate = DateTime.fromISO(data.originalAssignedDate);
    }
    if (data.completedDate) {
      item.completedDate = DateTime.fromISO(data.completedDate);
    }
    if (data.createdDate) {
      item.createdDate = DateTime.fromISO(data.createdDate);
    }

    // Restore reschedule history
    if (data.rescheduleHistory) {
      item.rescheduleHistory = data.rescheduleHistory.map((event: any) => ({
        ...event,
        date: DateTime.fromISO(event.date),
        fromDate: DateTime.fromISO(event.fromDate),
        toDate: DateTime.fromISO(event.toDate)
      }));
    }

    // Restore other properties
    item.allocatedTime = data.allocatedTime || item.allocatedTime;
    item.remainingTime = data.remainingTime || item.remainingTime;
    item.estimatedTime = data.estimatedTime || item.estimatedTime;
    item.rescheduleCount = data.rescheduleCount || 0;
    item.isAssignedToday = data.isAssignedToday || false;
    item.needsRescheduleWarning = data.needsRescheduleWarning || false;
    item.parentTaskId = data.parentTaskId;
    item.childTaskIds = data.childTaskIds || [];
    item.tags = data.tags || [];
    item.isCompleted = data.isCompleted || false;
    item.dayEndStatus = data.dayEndStatus;

    return item;
  }
}
