import { App, PluginSettingTab, Setting } from 'obsidian';
import { TodoPluginSettings, WeeklyScheduleSettings, DaySchedule, AutoPriorityThresholds } from '../models/TodoPluginSettings';

interface EnhancedTodoPluginInterface {
  getSettings(): TodoPluginSettings;
  updateSettings(settings: TodoPluginSettings): Promise<void>;
}

export class EnhancedSettingsTab extends PluginSettingTab {
  private plugin: EnhancedTodoPluginInterface;

  constructor(app: App, plugin: EnhancedTodoPluginInterface) {
    super(app, plugin as any);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h1', { text: 'Enhanced Todo Plugin Settings' });
    containerEl.createEl('p', { 
      text: 'Configure your Enhanced Todo Plugin preferences below.',
      cls: 'setting-item-description'
    });

    this.addGeneralSettings();
    this.addDateFormatSettings();
    this.addPrioritySettings();
    this.addWeeklyScheduleSettings();
    this.addTaskBreakdownSettings();
    this.addUIPreferences();
    this.addNotificationSettings();
    this.addPerformanceSettings();
    this.addExportImportSettings();
    this.addAdvancedSettings();
  }

  private addGeneralSettings(): void {
    const { containerEl } = this;
    const settings = this.plugin.getSettings();
    
    containerEl.createEl('h2', { text: 'General Settings' });

    new Setting(containerEl)
      .setName('Show completed tasks')
      .setDesc('Display completed tasks in the todo view alongside incomplete ones')
      .addToggle(toggle => toggle
        .setValue(settings.showCompletedTasks)
        .onChange(async (value) => {
          const newSettings = { ...settings, showCompletedTasks: value };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Open files in new leaf')
      .setDesc('Open task files in a new pane instead of replacing the current one')
      .addToggle(toggle => toggle
        .setValue(settings.openFilesInNewLeaf)
        .onChange(async (value) => {
          const newSettings = { ...settings, openFilesInNewLeaf: value };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Enable auto-priority assignment')
      .setDesc('Automatically assign priority to new tasks based on keywords and context')
      .addToggle(toggle => toggle
        .setValue(settings.enableAutoPriority)
        .onChange(async (value) => {
          const newSettings = { ...settings, enableAutoPriority: value };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Enable reschedule warnings')
      .setDesc('Show warnings when tasks are rescheduled multiple times')
      .addToggle(toggle => toggle
        .setValue(settings.enableRescheduleWarnings)
        .onChange(async (value) => {
          const newSettings = { ...settings, enableRescheduleWarnings: value };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Reschedule warning threshold')
      .setDesc('Number of reschedules before showing warnings')
      .addSlider(slider => slider
        .setLimits(1, 10, 1)
        .setValue(settings.rescheduleWarningThreshold)
        .setDynamicTooltip()
        .onChange(async (value) => {
          const newSettings = { ...settings, rescheduleWarningThreshold: value };
          await this.plugin.updateSettings(newSettings);
        }));
  }

  private addDateFormatSettings(): void {
    const { containerEl } = this;
    const settings = this.plugin.getSettings();
    
    containerEl.createEl('h2', { text: 'Date Format Settings' });

    new Setting(containerEl)
      .setName('Date tag format')
      .setDesc('Format for date tags (use %date% as placeholder). Example: #due/%date% or @%date%')
      .addText(text => text
        .setPlaceholder('#due/%date%')
        .setValue(settings.dateTagFormat)
        .onChange(async (value) => {
          const newSettings = { ...settings, dateTagFormat: value || '#due/%date%' };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Date format')
      .setDesc('Date format used in tags. Use standard format: yyyy-MM-dd (recommended)')
      .addText(text => text
        .setPlaceholder('yyyy-MM-dd')
        .setValue(settings.dateFormat)
        .onChange(async (value) => {
          const newSettings = { ...settings, dateFormat: value || 'yyyy-MM-dd' };
          await this.plugin.updateSettings(newSettings);
        }));
  }

  private addPrioritySettings(): void {
    const { containerEl } = this;
    const settings = this.plugin.getSettings();
    
    containerEl.createEl('h2', { text: 'Priority Settings' });
    containerEl.createEl('p', { 
      text: 'Configure automatic priority assignment based on task complexity.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Priority A threshold')
      .setDesc('Number of subtasks required for Priority A assignment')
      .addSlider(slider => slider
        .setLimits(1, 20, 1)
        .setValue(settings.subtaskThresholds.priorityA)
        .setDynamicTooltip()
        .onChange(async (value) => {
          const newThresholds: AutoPriorityThresholds = {
            ...settings.subtaskThresholds,
            priorityA: value
          };
          const newSettings = { ...settings, subtaskThresholds: newThresholds };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Priority B threshold')
      .setDesc('Number of subtasks required for Priority B assignment')
      .addSlider(slider => slider
        .setLimits(1, 15, 1)
        .setValue(settings.subtaskThresholds.priorityB)
        .setDynamicTooltip()
        .onChange(async (value) => {
          const newThresholds: AutoPriorityThresholds = {
            ...settings.subtaskThresholds,
            priorityB: value
          };
          const newSettings = { ...settings, subtaskThresholds: newThresholds };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Priority C threshold')
      .setDesc('Number of subtasks required for Priority C assignment')
      .addSlider(slider => slider
        .setLimits(1, 10, 1)
        .setValue(settings.subtaskThresholds.priorityC)
        .setDynamicTooltip()
        .onChange(async (value) => {
          const newThresholds: AutoPriorityThresholds = {
            ...settings.subtaskThresholds,
            priorityC: value
          };
          const newSettings = { ...settings, subtaskThresholds: newThresholds };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Priority D threshold')
      .setDesc('Number of subtasks required for Priority D assignment (minimum)')
      .addSlider(slider => slider
        .setLimits(0, 5, 1)
        .setValue(settings.subtaskThresholds.priorityD)
        .setDynamicTooltip()
        .onChange(async (value) => {
          const newThresholds: AutoPriorityThresholds = {
            ...settings.subtaskThresholds,
            priorityD: value
          };
          const newSettings = { ...settings, subtaskThresholds: newThresholds };
          await this.plugin.updateSettings(newSettings);
        }));
  }

  private addWeeklyScheduleSettings(): void {
    const { containerEl } = this;
    const settings = this.plugin.getSettings();
    
    containerEl.createEl('h2', { text: 'Weekly Schedule Settings' });
    containerEl.createEl('p', { 
      text: 'Configure your work schedule for better task planning and end-of-day notifications.',
      cls: 'setting-item-description'
    });

    // Global schedule settings
    new Setting(containerEl)
      .setName('Default start of day')
      .setDesc('Default time when your work day begins (24-hour format)')
      .addText(text => text
        .setPlaceholder('08:00')
        .setValue(settings.weeklySchedule.defaultStartOfDay)
        .onChange(async (value) => {
          const newSchedule: WeeklyScheduleSettings = {
            ...settings.weeklySchedule,
            defaultStartOfDay: value || '08:00'
          };
          const newSettings = { ...settings, weeklySchedule: newSchedule };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Default end of day')
      .setDesc('Default time when your work day ends (24-hour format)')
      .addText(text => text
        .setPlaceholder('22:00')
        .setValue(settings.weeklySchedule.defaultEndOfDay)
        .onChange(async (value) => {
          const newSchedule: WeeklyScheduleSettings = {
            ...settings.weeklySchedule,
            defaultEndOfDay: value || '22:00'
          };
          const newSettings = { ...settings, weeklySchedule: newSchedule };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Enable weekend work')
      .setDesc('Allow task scheduling and notifications on weekends')
      .addToggle(toggle => toggle
        .setValue(settings.weeklySchedule.enableWeekendWork)
        .onChange(async (value) => {
          const newSchedule: WeeklyScheduleSettings = {
            ...settings.weeklySchedule,
            enableWeekendWork: value
          };
          const newSettings = { ...settings, weeklySchedule: newSchedule };
          await this.plugin.updateSettings(newSettings);
        }));

    // Individual day settings
    containerEl.createEl('h3', { text: 'Individual Day Settings' });
    containerEl.createEl('p', { 
      text: 'Configure work hours for each day of the week. Days marked as work days will trigger end-of-day notifications.',
      cls: 'setting-item-description'
    });
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Create a more organized layout for day settings
    const daySettingsContainer = containerEl.createDiv('day-settings-container');
    
    settings.weeklySchedule.schedules.forEach((daySchedule, index) => {
      const dayName = dayNames[daySchedule.dayOfWeek];
      
      const dayContainer = daySettingsContainer.createDiv('day-setting-group');
      dayContainer.createEl('h4', { text: `${dayName} Settings`, cls: 'day-header' });
      
      new Setting(dayContainer)
        .setName(`Enable ${dayName}`)
        .setDesc(`Mark ${dayName} as a work day`)
        .addToggle(toggle => toggle
          .setValue(daySchedule.isWorkDay)
          .onChange(async (value) => {
            const newSchedules = [...settings.weeklySchedule.schedules];
            newSchedules[index] = { ...daySchedule, isWorkDay: value };
            const newSchedule: WeeklyScheduleSettings = {
              ...settings.weeklySchedule,
              schedules: newSchedules
            };
            const newSettings = { ...settings, weeklySchedule: newSchedule };
            await this.plugin.updateSettings(newSettings);
            this.display(); // Refresh to show/hide time settings
          }));

      if (daySchedule.isWorkDay) {
        const timeContainer = dayContainer.createDiv('time-settings');
        
        new Setting(timeContainer)
          .setName('Start time')
          .setDesc(`Work start time for ${dayName} (HH:MM format)`)
          .addText(text => text
            .setPlaceholder(settings.weeklySchedule.defaultStartOfDay)
            .setValue(daySchedule.startOfDayTime || settings.weeklySchedule.defaultStartOfDay)
            .onChange(async (value) => {
              // Validate time format
              const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
              if (value && !timeRegex.test(value)) {
                return; // Invalid format, don't save
              }
              
              const newSchedules = [...settings.weeklySchedule.schedules];
              newSchedules[index] = { 
                ...daySchedule, 
                startOfDayTime: value || settings.weeklySchedule.defaultStartOfDay 
              };
              const newSchedule: WeeklyScheduleSettings = {
                ...settings.weeklySchedule,
                schedules: newSchedules
              };
              const newSettings = { ...settings, weeklySchedule: newSchedule };
              await this.plugin.updateSettings(newSettings);
            }));

        new Setting(timeContainer)
          .setName('End time')
          .setDesc(`Work end time for ${dayName} (HH:MM format)`)
          .addText(text => text
            .setPlaceholder(settings.weeklySchedule.defaultEndOfDay)
            .setValue(daySchedule.endOfDayTime || settings.weeklySchedule.defaultEndOfDay)
            .onChange(async (value) => {
              // Validate time format
              const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
              if (value && !timeRegex.test(value)) {
                return; // Invalid format, don't save
              }
              
              const newSchedules = [...settings.weeklySchedule.schedules];
              newSchedules[index] = { 
                ...daySchedule, 
                endOfDayTime: value || settings.weeklySchedule.defaultEndOfDay 
              };
              const newSchedule: WeeklyScheduleSettings = {
                ...settings.weeklySchedule,
                schedules: newSchedules
              };
              const newSettings = { ...settings, weeklySchedule: newSchedule };
              await this.plugin.updateSettings(newSettings);
            }));

        // Calculate and display work hours for this day
        const startTime = daySchedule.startOfDayTime || settings.weeklySchedule.defaultStartOfDay;
        const endTime = daySchedule.endOfDayTime || settings.weeklySchedule.defaultEndOfDay;
        const workHours = this.calculateWorkHours(startTime, endTime);
        
        const infoDiv = timeContainer.createDiv('work-hours-info');
        infoDiv.createEl('span', { 
          text: `Work hours: ${workHours.toFixed(1)}h`,
          cls: 'work-hours-display'
        });
      }
    });

    // Custom schedule management
    this.addCustomScheduleManagement(containerEl, settings);
  }

  private addTaskBreakdownSettings(): void {
    const { containerEl } = this;
    const settings = this.plugin.getSettings();
    
    containerEl.createEl('h2', { text: 'Task Breakdown Settings' });
    containerEl.createEl('p', { 
      text: 'Configure automatic task analysis and breakdown suggestions.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Enable task breakdown analysis')
      .setDesc('Analyze tasks for complexity and suggest breakdowns when needed')
      .addToggle(toggle => toggle
        .setValue(settings.enableTaskBreakdownAnalysis)
        .onChange(async (value) => {
          const newSettings = { ...settings, enableTaskBreakdownAnalysis: value };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Auto-show breakdown suggestions')
      .setDesc('Automatically display breakdown suggestions for problematic tasks')
      .addToggle(toggle => toggle
        .setValue(settings.autoShowBreakdownSuggestions)
        .onChange(async (value) => {
          const newSettings = { ...settings, autoShowBreakdownSuggestions: value };
          await this.plugin.updateSettings(newSettings);
        }));
  }

  private addUIPreferences(): void {
    const { containerEl } = this;
    const settings = this.plugin.getSettings();
    
    containerEl.createEl('h2', { text: 'UI Preferences' });
    containerEl.createEl('p', { 
      text: 'Customize the appearance and behavior of the Enhanced Todo interface.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Default view')
      .setDesc('Choose the default view mode for the todo panel')
      .addDropdown(dropdown => dropdown
        .addOption('list', '📋 List View')
        .addOption('kanban', '📊 Kanban Board')
        .addOption('calendar', '📅 Calendar View')
        .setValue(settings.defaultView)
        .onChange(async (value: 'list' | 'kanban' | 'calendar') => {
          const newSettings = { ...settings, defaultView: value };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Enable animations')
      .setDesc('Enable smooth animations and transitions in the UI for a more polished experience')
      .addToggle(toggle => toggle
        .setValue(settings.enableAnimations)
        .onChange(async (value) => {
          const newSettings = { ...settings, enableAnimations: value };
          await this.plugin.updateSettings(newSettings);
          // Apply animation class to container for immediate feedback
          if (value) {
            containerEl.addClass('animations-enabled');
          } else {
            containerEl.removeClass('animations-enabled');
          }
        }));

    new Setting(containerEl)
      .setName('Compact mode')
      .setDesc('Use a more compact layout to fit more tasks on screen (reduces padding and spacing)')
      .addToggle(toggle => toggle
        .setValue(settings.compactMode)
        .onChange(async (value) => {
          const newSettings = { ...settings, compactMode: value };
          await this.plugin.updateSettings(newSettings);
          // Apply compact class for immediate preview
          if (value) {
            containerEl.addClass('compact-mode');
          } else {
            containerEl.removeClass('compact-mode');
          }
        }));

    // Theme and appearance settings
    containerEl.createEl('h3', { text: 'Appearance Settings' });
    
    // Add a preview section
    const previewContainer = containerEl.createDiv('ui-preview-container');
    previewContainer.createEl('h4', { text: 'Preview' });
    
    const previewTask = previewContainer.createDiv('preview-task-item');
    previewTask.innerHTML = `
      <div class="task-checkbox">
        <input type="checkbox" disabled>
      </div>
      <div class="task-content">
        <div class="task-title">
          <span>Sample task with priority indicator</span>
          <span class="priority-indicator">A</span>
          <span class="time-allocation">⏱️ 30min</span>
        </div>
        <div class="task-due-date">
          <span class="due-today">📅 Due today</span>
        </div>
      </div>
      <div class="task-actions">
        <button>📂</button>
        <button>✏️</button>
      </div>
    `;
    
    // Apply current settings to preview
    if (settings.compactMode) {
      previewContainer.addClass('compact-mode');
    }
    if (settings.enableAnimations) {
      previewContainer.addClass('animations-enabled');
    }
  }

  private addNotificationSettings(): void {
    const { containerEl } = this;
    const settings = this.plugin.getSettings();
    
    containerEl.createEl('h2', { text: 'Notification Settings' });

    new Setting(containerEl)
      .setName('Enable end-of-day notifications')
      .setDesc('Show notifications at the end of each work day for incomplete tasks')
      .addToggle(toggle => toggle
        .setValue(settings.enableEndOfDayNotifications)
        .onChange(async (value) => {
          const newSettings = { ...settings, enableEndOfDayNotifications: value };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Enable overdue notifications')
      .setDesc('Show notifications for overdue tasks')
      .addToggle(toggle => toggle
        .setValue(settings.enableOverdueNotifications)
        .onChange(async (value) => {
          const newSettings = { ...settings, enableOverdueNotifications: value };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Notification sound')
      .setDesc('Play a sound with notifications')
      .addToggle(toggle => toggle
        .setValue(settings.notificationSound)
        .onChange(async (value) => {
          const newSettings = { ...settings, notificationSound: value };
          await this.plugin.updateSettings(newSettings);
        }));
  }

  private addPerformanceSettings(): void {
    const { containerEl } = this;
    const settings = this.plugin.getSettings();
    
    containerEl.createEl('h2', { text: 'Performance Settings' });
    containerEl.createEl('p', { 
      text: 'Optimize performance for large numbers of tasks.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Max tasks per view')
      .setDesc('Maximum number of tasks to display at once (higher values may impact performance)')
      .addSlider(slider => slider
        .setLimits(50, 1000, 50)
        .setValue(settings.maxTasksPerView)
        .setDynamicTooltip()
        .onChange(async (value) => {
          const newSettings = { ...settings, maxTasksPerView: value };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Enable virtual scrolling')
      .setDesc('Use virtual scrolling for better performance with many tasks')
      .addToggle(toggle => toggle
        .setValue(settings.enableVirtualScrolling)
        .onChange(async (value) => {
          const newSettings = { ...settings, enableVirtualScrolling: value };
          await this.plugin.updateSettings(newSettings);
        }));
  }

  private addExportImportSettings(): void {
    const { containerEl } = this;
    const settings = this.plugin.getSettings();
    
    containerEl.createEl('h2', { text: 'Export/Import Settings' });
    containerEl.createEl('p', { 
      text: 'Configure how task data is exported and imported.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Default export format')
      .setDesc('Choose the default format for exporting tasks')
      .addDropdown(dropdown => dropdown
        .addOption('json', '📄 JSON (Complete data)')
        .addOption('csv', '📊 CSV (Spreadsheet compatible)')
        .addOption('markdown', '📝 Markdown (Human readable)')
        .setValue(settings.defaultExportFormat)
        .onChange(async (value: 'json' | 'csv' | 'markdown') => {
          const newSettings = { ...settings, defaultExportFormat: value };
          await this.plugin.updateSettings(newSettings);
        }));

    new Setting(containerEl)
      .setName('Include completed tasks in export')
      .setDesc('Include completed tasks when exporting task data')
      .addToggle(toggle => toggle
        .setValue(settings.includeCompletedInExport)
        .onChange(async (value) => {
          const newSettings = { ...settings, includeCompletedInExport: value };
          await this.plugin.updateSettings(newSettings);
        }));

    // Export/Import actions
    containerEl.createEl('h3', { text: 'Export/Import Actions' });
    
    const actionsContainer = containerEl.createDiv('export-import-actions');
    
    // Export current tasks
    new Setting(actionsContainer)
      .setName('Export current tasks')
      .setDesc('Export all current tasks using the selected format')
      .addButton(button => button
        .setButtonText('Export Tasks')
        .setCta()
        .onClick(async () => {
          // This would trigger the export functionality
          // For now, just show a placeholder message
          const format = settings.defaultExportFormat;
          const includeCompleted = settings.includeCompletedInExport;
          
          // Create a simple export preview
          const exportData = {
            exportDate: new Date().toISOString(),
            format: format,
            includeCompleted: includeCompleted,
            settings: {
              dateFormat: settings.dateFormat,
              dateTagFormat: settings.dateTagFormat
            },
            tasks: [] // Would be populated with actual task data
          };
          
          // Show export preview
          const exportPreview = actionsContainer.createDiv('export-preview');
          exportPreview.createEl('h4', { text: 'Export Preview' });
          exportPreview.createEl('p', { text: `Format: ${format.toUpperCase()}` });
          exportPreview.createEl('p', { text: `Include completed: ${includeCompleted ? 'Yes' : 'No'}` });
          exportPreview.createEl('p', { text: 'Note: Export functionality would be implemented in the main plugin.' });
          
          // Auto-remove preview after 5 seconds
          setTimeout(() => {
            exportPreview.remove();
          }, 5000);
        }));

    // Import tasks
    new Setting(actionsContainer)
      .setName('Import tasks')
      .setDesc('Import tasks from a previously exported file')
      .addButton(button => button
        .setButtonText('Import Tasks')
        .onClick(async () => {
          // This would trigger the import functionality
          const importInfo = actionsContainer.createDiv('import-info');
          importInfo.createEl('h4', { text: 'Import Information' });
          importInfo.createEl('p', { text: 'Import functionality would allow you to:' });
          const list = importInfo.createEl('ul');
          list.createEl('li', { text: 'Import from JSON, CSV, or Markdown files' });
          list.createEl('li', { text: 'Merge with existing tasks or replace them' });
          list.createEl('li', { text: 'Validate data format before importing' });
          list.createEl('li', { text: 'Preview changes before applying' });
          
          // Auto-remove info after 5 seconds
          setTimeout(() => {
            importInfo.remove();
          }, 5000);
        }));

    // Backup settings
    containerEl.createEl('h3', { text: 'Backup & Restore' });
    
    const backupContainer = containerEl.createDiv('backup-restore-actions');
    
    new Setting(backupContainer)
      .setName('Backup settings')
      .setDesc('Create a backup of all plugin settings')
      .addButton(button => button
        .setButtonText('Backup Settings')
        .onClick(async () => {
          const settingsBackup = {
            backupDate: new Date().toISOString(),
            pluginVersion: '1.0.0', // Would get from manifest
            settings: settings
          };
          
          // Create download link (in a real implementation)
          const backupPreview = backupContainer.createDiv('backup-preview');
          backupPreview.createEl('h4', { text: 'Settings Backup Created' });
          backupPreview.createEl('p', { text: 'Backup would be saved as: enhanced-todo-settings-backup.json' });
          
          setTimeout(() => {
            backupPreview.remove();
          }, 3000);
        }));

    new Setting(backupContainer)
      .setName('Restore settings')
      .setDesc('Restore plugin settings from a backup file')
      .addButton(button => button
        .setButtonText('Restore Settings')
        .setWarning()
        .onClick(async () => {
          const restoreInfo = backupContainer.createDiv('restore-info');
          restoreInfo.createEl('h4', { text: 'Restore Settings' });
          restoreInfo.createEl('p', { text: 'This would allow you to select a backup file and restore all settings.' });
          restoreInfo.createEl('p', { text: 'Warning: This will overwrite all current settings!' });
          
          setTimeout(() => {
            restoreInfo.remove();
          }, 4000);
        }));
  }

  private addAdvancedSettings(): void {
    const { containerEl } = this;
    const settings = this.plugin.getSettings();
    
    containerEl.createEl('h2', { text: 'Advanced Settings' });

    // Reset settings button
    new Setting(containerEl)
      .setName('Reset to defaults')
      .setDesc('Reset all settings to their default values (this cannot be undone)')
      .addButton(button => button
        .setButtonText('Reset All Settings')
        .setWarning()
        .onClick(async () => {
          // Import the default settings
          const { DEFAULT_SETTINGS } = await import('../models/TodoPluginSettings');
          await this.plugin.updateSettings(DEFAULT_SETTINGS);
          this.display(); // Refresh the settings display
        }));

    // Debug information
    containerEl.createEl('h3', { text: 'Debug Information' });
    containerEl.createEl('p', { 
      text: 'Current settings structure (for debugging):',
      cls: 'setting-item-description'
    });
    
    const debugContainer = containerEl.createEl('details');
    debugContainer.createEl('summary', { text: 'Show current settings JSON' });
    const pre = debugContainer.createEl('pre');
    pre.style.background = 'var(--background-secondary)';
    pre.style.padding = '10px';
    pre.style.borderRadius = '4px';
    pre.style.fontSize = '12px';
    pre.style.overflow = 'auto';
    pre.style.maxHeight = '300px';
    pre.textContent = JSON.stringify(settings, null, 2);
  }

  private calculateWorkHours(startTime: string, endTime: string): number {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;
    
    // Handle overnight shifts (end time is next day)
    if (endMinutesTotal < startMinutesTotal) {
      return ((24 * 60) - startMinutesTotal + endMinutesTotal) / 60;
    }
    
    return (endMinutesTotal - startMinutesTotal) / 60;
  }

  private addCustomScheduleManagement(containerEl: HTMLElement, settings: TodoPluginSettings): void {
    containerEl.createEl('h3', { text: 'Custom Schedule Overrides' });
    containerEl.createEl('p', { 
      text: 'Set custom schedules for specific dates (holidays, special events, etc.)',
      cls: 'setting-item-description'
    });

    // Display existing custom schedules
    const customSchedules = settings.weeklySchedule.customSchedules;
    const customScheduleContainer = containerEl.createDiv('custom-schedule-container');
    
    if (Object.keys(customSchedules).length > 0) {
      customScheduleContainer.createEl('h4', { text: 'Current Custom Schedules' });
      
      Object.entries(customSchedules).forEach(([dateKey, schedule]) => {
        const scheduleItem = customScheduleContainer.createDiv('custom-schedule-item');
        
        const scheduleInfo = scheduleItem.createDiv('schedule-info');
        scheduleInfo.createEl('strong', { text: dateKey });
        scheduleInfo.createEl('span', { 
          text: schedule.isWorkDay 
            ? ` - Work day (${schedule.startOfDayTime || settings.weeklySchedule.defaultStartOfDay} to ${schedule.endOfDayTime || settings.weeklySchedule.defaultEndOfDay})`
            : ' - Non-work day'
        });
        
        const removeButton = scheduleItem.createEl('button', { 
          text: 'Remove',
          cls: 'mod-warning'
        });
        removeButton.onclick = async () => {
          const newCustomSchedules = { ...customSchedules };
          delete newCustomSchedules[dateKey];
          
          const newSchedule: WeeklyScheduleSettings = {
            ...settings.weeklySchedule,
            customSchedules: newCustomSchedules
          };
          const newSettings = { ...settings, weeklySchedule: newSchedule };
          await this.plugin.updateSettings(newSettings);
          this.display(); // Refresh to update the display
        };
      });
    } else {
      customScheduleContainer.createEl('p', { 
        text: 'No custom schedules configured.',
        cls: 'setting-item-description'
      });
    }

    // Add new custom schedule
    containerEl.createEl('h4', { text: 'Add Custom Schedule' });
    
    const addScheduleContainer = containerEl.createDiv('add-custom-schedule');
    let newDate = '';
    let newIsWorkDay = false;
    let newStartTime = settings.weeklySchedule.defaultStartOfDay;
    let newEndTime = settings.weeklySchedule.defaultEndOfDay;

    new Setting(addScheduleContainer)
      .setName('Date')
      .setDesc('Date for custom schedule (YYYY-MM-DD format)')
      .addText(text => text
        .setPlaceholder('2024-12-25')
        .onChange((value) => {
          newDate = value;
        }));

    new Setting(addScheduleContainer)
      .setName('Work day')
      .setDesc('Is this a work day?')
      .addToggle(toggle => toggle
        .setValue(newIsWorkDay)
        .onChange((value) => {
          newIsWorkDay = value;
        }));

    new Setting(addScheduleContainer)
      .setName('Start time')
      .setDesc('Work start time (HH:MM format)')
      .addText(text => text
        .setPlaceholder(settings.weeklySchedule.defaultStartOfDay)
        .setValue(newStartTime)
        .onChange((value) => {
          newStartTime = value || settings.weeklySchedule.defaultStartOfDay;
        }));

    new Setting(addScheduleContainer)
      .setName('End time')
      .setDesc('Work end time (HH:MM format)')
      .addText(text => text
        .setPlaceholder(settings.weeklySchedule.defaultEndOfDay)
        .setValue(newEndTime)
        .onChange((value) => {
          newEndTime = value || settings.weeklySchedule.defaultEndOfDay;
        }));

    new Setting(addScheduleContainer)
      .setName('Add custom schedule')
      .setDesc('Add the custom schedule for the specified date')
      .addButton(button => button
        .setButtonText('Add Schedule')
        .setCta()
        .onClick(async () => {
          // Validate date format
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!newDate || !dateRegex.test(newDate)) {
            // Could show an error message here
            return;
          }

          // Validate time formats
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(newStartTime) || !timeRegex.test(newEndTime)) {
            return;
          }

          const newCustomSchedule: DaySchedule = {
            dayOfWeek: new Date(newDate).getDay(),
            isWorkDay: newIsWorkDay,
            startOfDayTime: newIsWorkDay ? newStartTime : undefined,
            endOfDayTime: newIsWorkDay ? newEndTime : undefined
          };

          const newCustomSchedules = {
            ...settings.weeklySchedule.customSchedules,
            [newDate]: newCustomSchedule
          };

          const newSchedule: WeeklyScheduleSettings = {
            ...settings.weeklySchedule,
            customSchedules: newCustomSchedules
          };
          const newSettings = { ...settings, weeklySchedule: newSchedule };
          await this.plugin.updateSettings(newSettings);
          this.display(); // Refresh to show the new schedule
        }));
  }
}
