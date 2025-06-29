import { App, PluginSettingTab, Setting } from 'obsidian';
import { TodoPluginSettings, WeeklyScheduleManager } from '../models/TodoPluginSettings';

export class EnhancedSettingsTab extends PluginSettingTab {
  private plugin: any; // Will be the main plugin instance

  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Enhanced Todo Plugin Settings' });

    this.addGeneralSettings();
    this.addDateFormatSettings();
    this.addPrioritySettings();
    this.addScheduleSettings();
    this.addNotificationSettings();
    this.addAdvancedSettings();
  }

  private addGeneralSettings(): void {
    const { containerEl } = this;
    
    containerEl.createEl('h3', { text: 'General Settings' });

    new Setting(containerEl)
      .setName('Show completed tasks')
      .setDesc('Display completed tasks in the todo view')
      .addToggle(toggle => toggle
        .setValue(this.plugin.getSettings().showCompletedTasks)
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.showCompletedTasks = value;
          await this.plugin.updateSettings(settings);
        }));

    new Setting(containerEl)
      .setName('Open files in new leaf')
      .setDesc('Open task files in a new pane instead of the current one')
      .addToggle(toggle => toggle
        .setValue(this.plugin.getSettings().openFilesInNewLeaf)
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.openFilesInNewLeaf = value;
          await this.plugin.updateSettings(settings);
        }));

    new Setting(containerEl)
      .setName('Auto-assign priority')
      .setDesc('Automatically assign priority to new tasks based on keywords and context')
      .addToggle(toggle => toggle
        .setValue(this.plugin.getSettings().autoAssignPriority)
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.autoAssignPriority = value;
          await this.plugin.updateSettings(settings);
        }));
  }

  private addDateFormatSettings(): void {
    const { containerEl } = this;
    
    containerEl.createEl('h3', { text: 'Date Format Settings' });

    new Setting(containerEl)
      .setName('Date tag format')
      .setDesc('Format for date tags (use %date% as placeholder)')
      .addText(text => text
        .setPlaceholder('#due/%date%')
        .setValue(this.plugin.getSettings().dateTagFormat)
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.dateTagFormat = value || '#due/%date%';
          await this.plugin.updateSettings(settings);
        }));

    new Setting(containerEl)
      .setName('Date format')
      .setDesc('Date format used in tags (YYYY-MM-DD recommended)')
      .addText(text => text
        .setPlaceholder('YYYY-MM-DD')
        .setValue(this.plugin.getSettings().dateFormat)
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.dateFormat = value || 'YYYY-MM-DD';
          await this.plugin.updateSettings(settings);
        }));
  }

  private addPrioritySettings(): void {
    const { containerEl } = this;
    
    containerEl.createEl('h3', { text: 'Priority Settings' });

    new Setting(containerEl)
      .setName('Priority keywords')
      .setDesc('Keywords that trigger automatic priority assignment (comma-separated)')
      .addTextArea(text => text
        .setPlaceholder('urgent, important, asap, critical')
        .setValue(this.plugin.getSettings().priorityKeywords.join(', '))
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.priorityKeywords = value.split(',').map(k => k.trim()).filter(k => k);
          await this.plugin.updateSettings(settings);
        }));

    new Setting(containerEl)
      .setName('Default task time allocation')
      .setDesc('Default time allocation for new tasks (in minutes)')
      .addSlider(slider => slider
        .setLimits(5, 240, 5)
        .setValue(this.plugin.getSettings().defaultTaskTime)
        .setDynamicTooltip()
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.defaultTaskTime = value;
          await this.plugin.updateSettings(settings);
        }));
  }

  private addScheduleSettings(): void {
    const { containerEl } = this;
    
    containerEl.createEl('h3', { text: 'Weekly Schedule Settings' });

    const settings = this.plugin.getSettings();
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
      const daySchedule = settings.weeklySchedule[day];
      
      containerEl.createEl('h4', { text: day.charAt(0).toUpperCase() + day.slice(1) });
      
      new Setting(containerEl)
        .setName(`${day} - Work hours`)
        .setDesc(`Available work hours for ${day}`)
        .addSlider(slider => slider
          .setLimits(0, 16, 0.5)
          .setValue(daySchedule.workHours)
          .setDynamicTooltip()
          .onChange(async (value) => {
            const newSettings = this.plugin.getSettings();
            newSettings.weeklySchedule[day].workHours = value;
            await this.plugin.updateSettings(newSettings);
          }));

      new Setting(containerEl)
        .setName(`${day} - End of day time`)
        .setDesc(`Time when the day ends (24-hour format)`)
        .addText(text => text
          .setPlaceholder('18:00')
          .setValue(daySchedule.endOfDayTime)
          .onChange(async (value) => {
            const newSettings = this.plugin.getSettings();
            newSettings.weeklySchedule[day].endOfDayTime = value || '18:00';
            await this.plugin.updateSettings(newSettings);
          }));
    });
  }

  private addNotificationSettings(): void {
    const { containerEl } = this;
    
    containerEl.createEl('h3', { text: 'Notification Settings' });

    new Setting(containerEl)
      .setName('Enable end-of-day notifications')
      .setDesc('Show notifications at the end of each day for incomplete tasks')
      .addToggle(toggle => toggle
        .setValue(this.plugin.getSettings().enableEndOfDayNotifications)
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.enableEndOfDayNotifications = value;
          await this.plugin.updateSettings(settings);
        }));

    new Setting(containerEl)
      .setName('Auto-show breakdown suggestions')
      .setDesc('Automatically show breakdown suggestions for problematic tasks')
      .addToggle(toggle => toggle
        .setValue(this.plugin.getSettings().autoShowBreakdownSuggestions)
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.autoShowBreakdownSuggestions = value;
          await this.plugin.updateSettings(settings);
        }));
  }

  private addAdvancedSettings(): void {
    const { containerEl } = this;
    
    containerEl.createEl('h3', { text: 'Advanced Settings' });

    new Setting(containerEl)
      .setName('Enable task breakdown analysis')
      .setDesc('Analyze tasks for complexity and suggest breakdowns')
      .addToggle(toggle => toggle
        .setValue(this.plugin.getSettings().enableTaskBreakdownAnalysis)
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.enableTaskBreakdownAnalysis = value;
          await this.plugin.updateSettings(settings);
        }));

    new Setting(containerEl)
      .setName('Max reschedule warnings')
      .setDesc('Number of reschedules before showing warnings')
      .addSlider(slider => slider
        .setLimits(1, 10, 1)
        .setValue(this.plugin.getSettings().maxRescheduleWarnings)
        .setDynamicTooltip()
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.maxRescheduleWarnings = value;
          await this.plugin.updateSettings(settings);
        }));

    new Setting(containerEl)
      .setName('Task complexity threshold')
      .setDesc('Character count threshold for considering a task complex')
      .addSlider(slider => slider
        .setLimits(50, 500, 10)
        .setValue(this.plugin.getSettings().taskComplexityThreshold)
        .setDynamicTooltip()
        .onChange(async (value) => {
          const settings = this.plugin.getSettings();
          settings.taskComplexityThreshold = value;
          await this.plugin.updateSettings(settings);
        }));

    // Reset settings button
    new Setting(containerEl)
      .setName('Reset to defaults')
      .setDesc('Reset all settings to their default values')
      .addButton(button => button
        .setButtonText('Reset')
        .setWarning()
        .onClick(async () => {
          const defaultSettings = {
            showCompletedTasks: false,
            openFilesInNewLeaf: true,
            autoAssignPriority: true,
            dateTagFormat: '#due/%date%',
            dateFormat: 'YYYY-MM-DD',
            priorityKeywords: ['urgent', 'important', 'asap', 'critical', 'deadline'],
            defaultTaskTime: 30,
            weeklySchedule: {
              monday: { workHours: 8, endOfDayTime: '18:00' },
              tuesday: { workHours: 8, endOfDayTime: '18:00' },
              wednesday: { workHours: 8, endOfDayTime: '18:00' },
              thursday: { workHours: 8, endOfDayTime: '18:00' },
              friday: { workHours: 8, endOfDayTime: '18:00' },
              saturday: { workHours: 4, endOfDayTime: '16:00' },
              sunday: { workHours: 2, endOfDayTime: '16:00' }
            },
            enableEndOfDayNotifications: true,
            autoShowBreakdownSuggestions: true,
            enableTaskBreakdownAnalysis: true,
            maxRescheduleWarnings: 3,
            taskComplexityThreshold: 150
          };
          
          await this.plugin.updateSettings(defaultSettings);
          this.display(); // Refresh the settings display
        }));
  }
}
