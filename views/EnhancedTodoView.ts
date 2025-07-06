import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { VIEW_TYPE_TODO, TaskPriority } from '../constants';
import { EnhancedTodoItem } from '../models/EnhancedTodoItem';
import { AutoPriorityAssigner } from '../services/AutoPriorityAssigner';
import { TaskSuitabilityAnalyzer } from '../services/TaskSuitabilityAnalyzer';

export class EnhancedTodoView extends ItemView {
  private plugin: any; // Will be the main plugin instance
  private currentFilter: 'today' | 'scheduled' | 'inbox' | 'all' = 'today';
  private currentPriorityFilter: TaskPriority | 'all' = 'all';

  constructor(leaf: WorkspaceLeaf, plugin: any) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_TODO;
  }

  getDisplayText(): string {
    return 'Enhanced Todo';
  }

  getIcon(): string {
    return 'checkmark';
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  async onClose(): Promise<void> {
    // Cleanup if needed
  }

  public refresh(): void {
    this.render();
  }

  private render(): void {
    const container = this.containerEl.children[1];
    container.empty();
    
    // Create main container
    container.createDiv('enhanced-todo-container', (el) => {
      this.renderHeader(el);
      this.renderFilters(el);
      this.renderTaskList(el);
      this.renderStats(el);
    });
  }

  private renderHeader(container: HTMLElement): void {
    container.createDiv('enhanced-todo-header', (el) => {
      el.createEl('h2', { text: 'Enhanced Todo Manager' });
      
      // Add refresh button
      el.createEl('button', { text: '🔄 Refresh' }, (btn) => {
        btn.onclick = () => {
          this.plugin.parseAllTodos();
        };
      });
    });
  }

  private renderFilters(container: HTMLElement): void {
    container.createDiv('enhanced-todo-filters', (el) => {
      // View filters
      el.createDiv('filter-group', (group) => {
        group.createEl('label', { text: 'View: ' });
        
        const filters = [
          { key: 'today', label: '📅 Today' },
          { key: 'scheduled', label: '🗓️ Scheduled' },
          { key: 'inbox', label: '📥 Inbox' },
          { key: 'all', label: '📋 All' }
        ];
        
        filters.forEach(filter => {
          group.createEl('button', { 
            text: filter.label,
            cls: this.currentFilter === filter.key ? 'active' : ''
          }, (btn) => {
            btn.onclick = () => {
              this.currentFilter = filter.key as any;
              this.render();
            };
          });
        });
      });
      
      // Priority filters
      el.createDiv('filter-group', (group) => {
        group.createEl('label', { text: 'Priority: ' });
        
        const priorities = [
          { key: 'all', label: '🔘 All' },
          { key: TaskPriority.A, label: '🔴 A' },
          { key: TaskPriority.B, label: '🟡 B' },
          { key: TaskPriority.C, label: '🟢 C' },
          { key: TaskPriority.D, label: '⚪ D' }
        ];
        
        priorities.forEach(priority => {
          group.createEl('button', {
            text: priority.label,
            cls: this.currentPriorityFilter === priority.key ? 'active' : ''
          }, (btn) => {
            btn.onclick = () => {
              this.currentPriorityFilter = priority.key as any;
              this.render();
            };
          });
        });
      });
    });
  }

  private renderTaskList(container: HTMLElement): void {
    const tasks = this.getFilteredTasks();
    
    container.createDiv('enhanced-todo-list', (el) => {
      if (tasks.length === 0) {
        el.createDiv('no-tasks', (noTasksEl) => {
          noTasksEl.setText('No tasks found for current filter.');
        });
        return;
      }
      
      // Group tasks by priority
      const tasksByPriority = this.groupTasksByPriority(tasks);
      
      Object.entries(tasksByPriority).forEach(([priority, priorityTasks]) => {
        if (priorityTasks.length === 0) return;
        
        el.createDiv('priority-group', (group) => {
          // Priority header
          group.createDiv('priority-header', (header) => {
            const emoji = AutoPriorityAssigner.getPriorityEmoji(priority as TaskPriority);
            const description = AutoPriorityAssigner.getPriorityDescription(priority as TaskPriority);
            header.createEl('h3', { text: `${emoji} Priority ${priority} - ${description}` });
            header.createEl('span', { 
              text: `${priorityTasks.length} task${priorityTasks.length > 1 ? 's' : ''}`,
              cls: 'task-count'
            });
          });
          
          // Tasks
          priorityTasks.forEach(task => {
            this.renderTask(group, task);
          });
        });
      });
    });
  }

  private renderTask(container: HTMLElement, task: EnhancedTodoItem): void {
    container.createDiv('task-item', (el) => {
      // Add priority indicator class
      el.addClass(`priority-${task.priority.toLowerCase()}`);
      
      // Checkbox
      el.createDiv('task-checkbox', (checkbox) => {
        const input = checkbox.createEl('input', { type: 'checkbox' });
        input.checked = task.isCompleted;
        input.onchange = () => {
          this.plugin.toggleTaskStatus(task);
        };
      });
      
      // Task content
      el.createDiv('task-content', (content) => {
        // Title and priority indicator
        content.createDiv('task-title', (title) => {
          title.createEl('span', { text: task.title });
          title.createEl('span', { 
            text: task.getDisplayPriority(),
            cls: 'priority-indicator'
          });
          
          // Time allocation
          title.createEl('span', {
            text: `⏱️ ${task.allocatedTime}min`,
            cls: 'time-allocation'
          });
          
          // Reschedule count
          if (task.rescheduleCount > 0) {
            title.createEl('span', {
              text: `🔄×${task.rescheduleCount}`,
              cls: task.needsRescheduleWarning ? 'reschedule-warning' : 'reschedule-count'
            });
          }
        });
        
        // Subtasks if any
        if (task.subtasks.length > 0) {
          content.createDiv('task-subtasks', (subtasks) => {
            const completed = task.subtasks.filter(st => st.isCompleted).length;
            subtasks.createEl('span', {
              text: `📋 ${completed}/${task.subtasks.length} subtasks completed`,
              cls: 'subtask-summary'
            });
            
            // Progress bar
            const progress = (completed / task.subtasks.length) * 100;
            subtasks.createDiv('progress-bar', (bar) => {
              const progressFill = bar.createDiv('progress-fill');
              progressFill.style.width = `${progress}%`;
            });
          });
        }
        
        // Task breakdown warnings
        if (TaskSuitabilityAnalyzer.shouldSuggestBreakdown(task)) {
          content.createDiv('task-warning', (warning) => {
            const urgency = TaskSuitabilityAnalyzer.getBreakdownUrgency(task);
            warning.addClass(`urgency-${urgency}`);
            
            const summary = TaskSuitabilityAnalyzer.generateBreakdownSummary(task);
            warning.createEl('span', { text: `⚠️ ${summary}` });
            
            warning.createEl('button', { text: '🔧 Auto-Fix' }, (btn) => {
              btn.onclick = async () => {
                try {
                  const result = this.plugin.getAutoFixSuggestions(task);
                  if (result.fixed) {
                    new Notice(`Auto-fixed ${result.changes.length} issue(s): ${result.changes.join(', ')}`);
                    await this.plugin.parseAllTodos(); // Re-parse to get updated data
                    this.render();
                  } else {
                    new Notice('No auto-fixable issues found for this task');
                  }
                } catch (error) {
                  console.error('Error applying auto-fix:', error);
                  new Notice('Failed to apply auto-fix');
                }
              };
            });
            
            warning.createEl('button', { text: '📝 Breakdown' }, (btn) => {
              btn.onclick = () => {
                this.showBreakdownSuggestions(task);
              };
            });
          });
        }
        
        // Due date info
        if (task.assignedDate) {
          content.createDiv('task-due-date', (due) => {
            const daysUntil = task.getDaysUntilDue();
            let dueDateText = '';
            let dueDateClass = '';
            
            if (task.isOverdue()) {
              dueDateText = `🔴 Overdue`;
              dueDateClass = 'overdue';
            } else if (daysUntil === 0) {
              dueDateText = `📅 Due today`;
              dueDateClass = 'due-today';
            } else if (daysUntil && daysUntil > 0) {
              dueDateText = `📅 Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
              dueDateClass = 'due-future';
            }
            
            due.createEl('span', { text: dueDateText, cls: dueDateClass });
          });
        }
      });
      
      // Actions
      el.createDiv('task-actions', (actions) => {
        // Edit task button (consolidated - opens file for editing)
        actions.createEl('button', { text: '✏️ Edit', title: 'Edit task' }, (btn) => {
          btn.onclick = () => {
            this.plugin.openTaskFile(task);
          };
        });
        
        // Enhanced date assignment button
        actions.createEl('button', { text: '📅', title: 'Schedule task' }, (btn) => {
          btn.onclick = () => {
            this.showDateAssignmentModal(task);
          };
        });
      });
    });
  }

  private renderStats(container: HTMLElement): void {
    const allTasks = this.plugin.getAllTodos();
    const todaysTasks = this.plugin.getTodaysAssignedTasks();
    const completedToday = todaysTasks.filter(t => t.isCompleted).length;
    
    container.createDiv('enhanced-todo-stats', (el) => {
      el.createEl('h3', { text: 'Statistics' });
      
      el.createDiv('stats-grid', (grid) => {
        grid.createDiv('stat-item', (item) => {
          item.createEl('span', { text: allTasks.length.toString(), cls: 'stat-number' });
          item.createEl('span', { text: 'Total Tasks', cls: 'stat-label' });
        });
        
        grid.createDiv('stat-item', (item) => {
          item.createEl('span', { text: todaysTasks.length.toString(), cls: 'stat-number' });
          item.createEl('span', { text: 'Today\'s Tasks', cls: 'stat-label' });
        });
        
        grid.createDiv('stat-item', (item) => {
          item.createEl('span', { text: completedToday.toString(), cls: 'stat-number' });
          item.createEl('span', { text: 'Completed Today', cls: 'stat-label' });
        });
        
        grid.createDiv('stat-item', (item) => {
          const percentage = todaysTasks.length > 0 ? Math.round((completedToday / todaysTasks.length) * 100) : 0;
          item.createEl('span', { text: `${percentage}%`, cls: 'stat-number' });
          item.createEl('span', { text: 'Completion Rate', cls: 'stat-label' });
        });
      });
    });
  }

  private getFilteredTasks(): EnhancedTodoItem[] {
    let tasks: EnhancedTodoItem[] = [];
    const settings = this.plugin.getSettings();
    
    switch (this.currentFilter) {
      case 'today':
        tasks = this.plugin.getAllTodos().filter(t => t.isAssignedToday);
        break;
      case 'scheduled':
        tasks = this.plugin.getAllTodos().filter(t => t.assignedDate && !t.isAssignedToday);
        break;
      case 'inbox':
        tasks = this.plugin.getAllTodos().filter(t => !t.isAssignedToday && !t.assignedDate);
        break;
      case 'all':
        tasks = this.plugin.getAllTodos();
        break;
    }
    
    // CRITICAL FIX: Apply completed task filter based on settings
    if (!settings.showCompletedTasks) {
      tasks = tasks.filter(t => !t.isCompleted);
    }
    
    // Apply priority filter
    if (this.currentPriorityFilter !== 'all') {
      tasks = tasks.filter(t => t.priority === this.currentPriorityFilter);
    }
    
    return tasks;
  }

  private groupTasksByPriority(tasks: EnhancedTodoItem[]): Record<string, EnhancedTodoItem[]> {
    const groups: Record<string, EnhancedTodoItem[]> = {
      [TaskPriority.A]: [],
      [TaskPriority.B]: [],
      [TaskPriority.C]: [],
      [TaskPriority.D]: []
    };
    
    tasks.forEach(task => {
      groups[task.priority].push(task);
    });
    
    return groups;
  }

  private showBreakdownSuggestions(task: EnhancedTodoItem): void {
    const suggestions = this.plugin.getBreakdownSuggestions(task);
    
    // Create a simple modal-like display
    const modal = this.containerEl.createDiv('breakdown-modal');
    modal.createEl('h3', { text: `Breakdown Suggestions for: ${task.title}` });
    
    if (suggestions.length === 0) {
      modal.createEl('p', { text: 'No specific breakdown suggestions available.' });
    } else {
      suggestions.forEach((suggestion, index) => {
        modal.createDiv('suggestion-item', (item) => {
          item.createEl('h4', { text: suggestion.title });
          item.createEl('p', { text: `Priority: ${suggestion.priority} (${suggestion.estimatedTime}min)` });
          item.createEl('p', { text: suggestion.reasoning });
          
          const list = item.createEl('ul');
          suggestion.subtasks.forEach((subtask: string) => {
            list.createEl('li', { text: subtask });
          });
        });
      });
    }
    
    modal.createEl('button', { text: 'Close' }, (btn) => {
      btn.onclick = () => {
        modal.remove();
      };
    });
  }

  private showDateAssignmentModal(task: EnhancedTodoItem): void {
    // Create modal overlay
    const overlay = this.containerEl.createDiv('date-assignment-overlay');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    // Create modal content
    const modal = overlay.createDiv('date-assignment-modal');
    modal.style.backgroundColor = 'var(--background-primary)';
    modal.style.border = '1px solid var(--background-modifier-border)';
    modal.style.borderRadius = '8px';
    modal.style.padding = '20px';
    modal.style.minWidth = '350px';
    modal.style.maxWidth = '500px';
    modal.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';

    // Modal header
    const header = modal.createEl('h3', { text: `📅 Schedule Task` });
    header.style.margin = '0 0 16px 0';
    header.style.color = 'var(--text-normal)';
    
    const taskInfo = modal.createEl('p', { text: `Task: ${task.title}` });
    taskInfo.style.margin = '0 0 20px 0';
    taskInfo.style.color = 'var(--text-muted)';
    taskInfo.style.fontSize = '14px';

    // Quick options section
    const quickSection = modal.createDiv('quick-options');
    const quickHeader = quickSection.createEl('h4', { text: 'Quick Options' });
    quickHeader.style.margin = '0 0 12px 0';
    quickHeader.style.color = 'var(--text-normal)';
    quickHeader.style.fontSize = '16px';

    const quickButtonsContainer = quickSection.createDiv('quick-buttons');
    quickButtonsContainer.style.display = 'grid';
    quickButtonsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    quickButtonsContainer.style.gap = '8px';
    quickButtonsContainer.style.marginBottom = '20px';

    // Quick option buttons
    const quickOptions = [
      { label: '📅 Today', days: 0 },
      { label: '🌅 Tomorrow', days: 1 },
      { label: '📆 Next Week', days: 7 },
      { label: '📅 Next Month', days: 30 }
    ];

    quickOptions.forEach(option => {
      const btn = quickButtonsContainer.createEl('button', { text: option.label });
      btn.style.padding = '8px 12px';
      btn.style.border = '1px solid var(--background-modifier-border)';
      btn.style.borderRadius = '4px';
      btn.style.backgroundColor = 'var(--background-secondary)';
      btn.style.color = 'var(--text-normal)';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '13px';
      
      btn.onmouseover = () => {
        btn.style.backgroundColor = 'var(--background-modifier-hover)';
      };
      btn.onmouseout = () => {
        btn.style.backgroundColor = 'var(--background-secondary)';
      };
      
      btn.onclick = () => {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + option.days);
        this.assignTaskToDate(task, targetDate);
        overlay.remove();
      };
    });

    // Custom date section
    const customSection = modal.createDiv('custom-date');
    const customHeader = customSection.createEl('h4', { text: 'Custom Date' });
    customHeader.style.margin = '0 0 12px 0';
    customHeader.style.color = 'var(--text-normal)';
    customHeader.style.fontSize = '16px';

    const dateInput = customSection.createEl('input', { type: 'date' });
    dateInput.style.width = '100%';
    dateInput.style.padding = '8px';
    dateInput.style.border = '1px solid var(--background-modifier-border)';
    dateInput.style.borderRadius = '4px';
    dateInput.style.backgroundColor = 'var(--background-primary)';
    dateInput.style.color = 'var(--text-normal)';
    dateInput.style.marginBottom = '20px';

    // Set default to today
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];

    // Action buttons
    const actionsContainer = modal.createDiv('modal-actions');
    actionsContainer.style.display = 'flex';
    actionsContainer.style.gap = '12px';
    actionsContainer.style.justifyContent = 'flex-end';

    // Cancel button
    const cancelBtn = actionsContainer.createEl('button', { text: 'Cancel' });
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.border = '1px solid var(--background-modifier-border)';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.backgroundColor = 'var(--background-secondary)';
    cancelBtn.style.color = 'var(--text-normal)';
    cancelBtn.style.cursor = 'pointer';
    
    cancelBtn.onclick = () => {
      overlay.remove();
    };

    // Assign button
    const assignBtn = actionsContainer.createEl('button', { text: 'Assign Date' });
    assignBtn.style.padding = '8px 16px';
    assignBtn.style.border = 'none';
    assignBtn.style.borderRadius = '4px';
    assignBtn.style.backgroundColor = 'var(--interactive-accent)';
    assignBtn.style.color = 'var(--text-on-accent)';
    assignBtn.style.cursor = 'pointer';
    assignBtn.style.fontWeight = '500';
    
    assignBtn.onclick = () => {
      const selectedDate = new Date(dateInput.value);
      this.assignTaskToDate(task, selectedDate);
      overlay.remove();
    };

    // Close modal when clicking overlay
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    };

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  private async assignTaskToDate(task: EnhancedTodoItem, date: Date): Promise<void> {
    try {
      // Add the new assignTaskToDate method to the plugin
      await this.plugin.assignTaskToDate(task, date);
      
      // Show success notification
      const dateStr = date.toLocaleDateString();
      const isToday = date.toDateString() === new Date().toDateString();
      const dateLabel = isToday ? 'today' : dateStr;
      
      // Use Obsidian's Notice for notifications
      new Notice(`Task scheduled for ${dateLabel}: ${task.title}`);
      
    } catch (error) {
      console.error('Error assigning task to date:', error);
      new Notice('Failed to schedule task');
    }
  }
}
