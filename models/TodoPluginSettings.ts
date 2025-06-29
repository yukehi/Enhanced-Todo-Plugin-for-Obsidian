import { DateTime } from 'luxon';

export interface DaySchedule {
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  isWorkDay: boolean;
  endOfDayTime?: string; // "22:00" format
  startOfDayTime?: string; // "08:00" format
}

export interface WeeklyScheduleSettings {
  schedules: DaySchedule[];
  defaultEndOfDay: string; // "22:00"
  defaultStartOfDay: string; // "08:00"
  enableWeekendWork: boolean;
  customSchedules: { [dateKey: string]: DaySchedule }; // For specific dates
}

export interface AutoPriorityThresholds {
  priorityA: number; // default: 6
  priorityB: number; // default: 4  
  priorityC: number; // default: 2
  priorityD: number; // default: 0
}

export interface TodoPluginSettings {
  // Original settings
  dateFormat: string;
  dateTagFormat: string;
  openFilesInNewLeaf: boolean;
  
  // Enhanced features
  enableAutoPriority: boolean;
  enableRescheduleWarnings: boolean;
  rescheduleWarningThreshold: number;
  
  // Weekly schedule
  weeklySchedule: WeeklyScheduleSettings;
  
  // Auto-priority thresholds
  subtaskThresholds: AutoPriorityThresholds;
  
  // Task breakdown settings
  enableTaskBreakdownAnalysis: boolean;
  autoShowBreakdownSuggestions: boolean;
  
  // UI preferences
  showCompletedTasks: boolean;
  defaultView: 'list' | 'kanban' | 'calendar';
  enableAnimations: boolean;
  compactMode: boolean;
  
  // Notification settings
  enableEndOfDayNotifications: boolean;
  enableOverdueNotifications: boolean;
  notificationSound: boolean;
  
  // Performance settings
  maxTasksPerView: number;
  enableVirtualScrolling: boolean;
  
  // Export/Import settings
  defaultExportFormat: 'json' | 'csv' | 'markdown';
  includeCompletedInExport: boolean;
}

export const DEFAULT_WEEKLY_SCHEDULE: WeeklyScheduleSettings = {
  schedules: [
    { dayOfWeek: 0, isWorkDay: false }, // Sunday
    { dayOfWeek: 1, isWorkDay: true, startOfDayTime: '08:00', endOfDayTime: '22:00' }, // Monday
    { dayOfWeek: 2, isWorkDay: true, startOfDayTime: '08:00', endOfDayTime: '22:00' }, // Tuesday
    { dayOfWeek: 3, isWorkDay: true, startOfDayTime: '08:00', endOfDayTime: '22:00' }, // Wednesday
    { dayOfWeek: 4, isWorkDay: true, startOfDayTime: '08:00', endOfDayTime: '22:00' }, // Thursday
    { dayOfWeek: 5, isWorkDay: true, startOfDayTime: '08:00', endOfDayTime: '20:00' }, // Friday
    { dayOfWeek: 6, isWorkDay: false }, // Saturday
  ],
  defaultEndOfDay: '22:00',
  defaultStartOfDay: '08:00',
  enableWeekendWork: false,
  customSchedules: {}
};

export const DEFAULT_AUTO_PRIORITY_THRESHOLDS: AutoPriorityThresholds = {
  priorityA: 6, // 6+ subtasks
  priorityB: 4, // 4+ subtasks
  priorityC: 2, // 2+ subtasks
  priorityD: 0  // 0-1 subtasks
};

export const DEFAULT_SETTINGS: TodoPluginSettings = {
  // Original settings
  dateFormat: 'yyyy-MM-dd',
  dateTagFormat: '#%date%',
  openFilesInNewLeaf: false,
  
  // Enhanced features
  enableAutoPriority: true,
  enableRescheduleWarnings: true,
  rescheduleWarningThreshold: 3,
  
  // Weekly schedule
  weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
  
  // Auto-priority thresholds
  subtaskThresholds: DEFAULT_AUTO_PRIORITY_THRESHOLDS,
  
  // Task breakdown settings
  enableTaskBreakdownAnalysis: true,
  autoShowBreakdownSuggestions: true,
  
  // UI preferences
  showCompletedTasks: false,
  defaultView: 'list',
  enableAnimations: true,
  compactMode: false,
  
  // Notification settings
  enableEndOfDayNotifications: true,
  enableOverdueNotifications: true,
  notificationSound: false,
  
  // Performance settings
  maxTasksPerView: 100,
  enableVirtualScrolling: true,
  
  // Export/Import settings
  defaultExportFormat: 'json',
  includeCompletedInExport: false
};

export class WeeklyScheduleManager {
  private settings: WeeklyScheduleSettings;
  
  constructor(settings: WeeklyScheduleSettings) {
    this.settings = settings;
  }
  
  // Get end of day time for specific date
  getEndOfDayTime(date: DateTime): string {
    const dayOfWeek = date.weekday % 7; // Convert to 0-6 format
    const daySchedule = this.settings.schedules.find(s => s.dayOfWeek === dayOfWeek);
    
    // Check for custom schedule for this specific date
    const dateKey = date.toISODate();
    const customSchedule = this.settings.customSchedules[dateKey || ''];
    
    if (customSchedule && customSchedule.endOfDayTime) {
      return customSchedule.endOfDayTime;
    }
    
    if (daySchedule && daySchedule.isWorkDay && daySchedule.endOfDayTime) {
      return daySchedule.endOfDayTime;
    }
    
    return this.settings.defaultEndOfDay;
  }
  
  // Get start of day time for specific date
  getStartOfDayTime(date: DateTime): string {
    const dayOfWeek = date.weekday % 7;
    const daySchedule = this.settings.schedules.find(s => s.dayOfWeek === dayOfWeek);
    
    const dateKey = date.toISODate();
    const customSchedule = this.settings.customSchedules[dateKey || ''];
    
    if (customSchedule && customSchedule.startOfDayTime) {
      return customSchedule.startOfDayTime;
    }
    
    if (daySchedule && daySchedule.isWorkDay && daySchedule.startOfDayTime) {
      return daySchedule.startOfDayTime;
    }
    
    return this.settings.defaultStartOfDay;
  }
  
  // Check if today is a work day
  isWorkDay(date: DateTime): boolean {
    const dayOfWeek = date.weekday % 7;
    const daySchedule = this.settings.schedules.find(s => s.dayOfWeek === dayOfWeek);
    
    const dateKey = date.toISODate();
    const customSchedule = this.settings.customSchedules[dateKey || ''];
    
    if (customSchedule) {
      return customSchedule.isWorkDay;
    }
    
    return daySchedule ? daySchedule.isWorkDay : false;
  }
  
  // Schedule end-of-day check
  scheduleEndOfDayCheck(callback: () => void): NodeJS.Timeout | null {
    const now = DateTime.now();
    const endTime = this.getEndOfDayTime(now);
    const [hours, minutes] = endTime.split(':').map(Number);
    
    const endOfDay = now.set({ hour: hours, minute: minutes, second: 0 });
    
    if (now < endOfDay && this.isWorkDay(now)) {
      const msUntilEndOfDay = endOfDay.toMillis() - now.toMillis();
      return setTimeout(callback, msUntilEndOfDay);
    }
    
    return null;
  }
  
  // Add custom schedule for specific date
  addCustomSchedule(date: DateTime, schedule: DaySchedule): void {
    const dateKey = date.toISODate();
    if (dateKey) {
      this.settings.customSchedules[dateKey] = schedule;
    }
  }
  
  // Remove custom schedule for specific date
  removeCustomSchedule(date: DateTime): void {
    const dateKey = date.toISODate();
    if (dateKey && this.settings.customSchedules[dateKey]) {
      delete this.settings.customSchedules[dateKey];
    }
  }
  
  // Get work days in current week
  getWorkDaysThisWeek(): DateTime[] {
    const now = DateTime.now();
    const startOfWeek = now.startOf('week');
    const workDays: DateTime[] = [];
    
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.plus({ days: i });
      if (this.isWorkDay(day)) {
        workDays.push(day);
      }
    }
    
    return workDays;
  }
  
  // Get total work hours in a day
  getWorkHoursForDay(date: DateTime): number {
    if (!this.isWorkDay(date)) return 0;
    
    const startTime = this.getStartOfDayTime(date);
    const endTime = this.getEndOfDayTime(date);
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;
    
    return (endMinutesTotal - startMinutesTotal) / 60;
  }
  
  // Update settings
  updateSettings(newSettings: WeeklyScheduleSettings): void {
    this.settings = newSettings;
  }
}
