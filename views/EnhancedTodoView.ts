import { ItemView, WorkspaceLeaf } from 'obsidian';
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
              btn.onclick = () => {
                const result = this.plugin.getAutoFixSuggestions(task);
                if (result.fixed) {
                  this.render();
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
        // Open file button
        actions.createEl('button', { text: '📂', title: 'Open file' }, (btn) => {
          btn.onclick = () => {
            this.plugin.openTaskFile(task);
          };
        });
        
        // Assign to today button (if not already assigned)
        if (!task.isAssignedToday) {
          actions.createEl('button', { text: '📅', title: 'Assign to today' }, (btn) => {
            btn.onclick = () => {
              this.plugin.assignTaskToToday(task);
            };
          });
        }
        
        // Edit button
        actions.createEl('button', { text: '✏️', title: 'Edit task' }, (btn) => {
          btn.onclick = () => {
            this.plugin.openTaskFile(task);
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
    
    switch (this.currentFilter) {
      case 'today':
        tasks = this.plugin.getTodaysAssignedTasks();
        break;
      case 'scheduled':
        tasks = this.plugin.getAllTodos().filter(t => t.assignedDate && !t.isAssignedToday && !t.isCompleted);
        break;
      case 'inbox':
        tasks = this.plugin.getUnassignedTasks();
        break;
      case 'all':
        tasks = this.plugin.getAllTodos().filter(t => !t.isCompleted);
        break;
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
}
