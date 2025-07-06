import { App, Plugin, PluginManifest, TFile, WorkspaceLeaf, Notice } from 'obsidian';
import { VIEW_TYPE_TODO, TaskPriority, TaskBreakdownSuggestion } from './constants';
import { EnhancedTodoItem } from './models/EnhancedTodoItem';
import { TodoPluginSettings, DEFAULT_SETTINGS, WeeklyScheduleManager } from './models/TodoPluginSettings';
import { EnhancedTodoParser } from './parsers/EnhancedTodoParser';
import { AutoPriorityAssigner } from './services/AutoPriorityAssigner';
import { TaskSuitabilityAnalyzer } from './services/TaskSuitabilityAnalyzer';
import { EnhancedTodoView } from './views/EnhancedTodoView';
import { EnhancedSettingsTab } from './ui/EnhancedSettingsTab';

export default class EnhancedTodoPlugin extends Plugin {
  private settings: TodoPluginSettings;
  private todoParser: EnhancedTodoParser;
  private scheduleManager: WeeklyScheduleManager;
  private view: EnhancedTodoView;
  private todos: Map<string, EnhancedTodoItem[]> = new Map();
  private endOfDayTimeout: NodeJS.Timeout | null = null;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
  }

  async onload(): Promise<void> {
    console.log('Loading Enhanced Todo Plugin');

    // Load settings
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    
    // Initialize services
    this.todoParser = new EnhancedTodoParser(
      this.settings.dateTagFormat,
      this.settings.dateFormat
    );
    this.scheduleManager = new WeeklyScheduleManager(this.settings.weeklySchedule);

    // Register view
    this.registerView(VIEW_TYPE_TODO, (leaf: WorkspaceLeaf) => {
      this.view = new EnhancedTodoView(leaf, this);
      return this.view;
    });

    // Add settings tab
    this.addSettingTab(new EnhancedSettingsTab(this.app, this));

    // Register commands
    this.registerCommands();

    // Set up event handlers
    this.registerEventHandlers();

    // Initialize when workspace is ready
    this.app.workspace.onLayoutReady(() => {
      this.initializePlugin();
    });
  }

  onunload(): void {
    console.log('Unloading Enhanced Todo Plugin');
    
    // Clean up timeouts
    if (this.endOfDayTimeout) {
      clearTimeout(this.endOfDayTimeout);
    }
    
    // Detach views
    this.app.workspace.getLeavesOfType(VIEW_TYPE_TODO).forEach((leaf) => leaf.detach());
  }

  private async initializePlugin(): Promise<void> {
    // Initialize leaf if not exists
    this.initLeaf();
    
    // Parse all todos
    await this.parseAllTodos();
    
    // Schedule end-of-day check
    this.scheduleEndOfDayCheck();
    
    // Check for problematic tasks
    await this.checkForProblematicTasks();
  }

  private initLeaf(): void {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_TODO).length) {
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      leaf.setViewState({
        type: VIEW_TYPE_TODO,
      });
    }
  }

  private registerCommands(): void {
    // Add command to open todo view
    this.addCommand({
      id: 'open-enhanced-todo-view',
      name: 'Open Enhanced Todo View',
      callback: () => {
        this.initLeaf();
      }
    });

    // Add command to parse all todos
    this.addCommand({
      id: 'parse-all-todos',
      name: 'Refresh All Todos',
      callback: async () => {
        await this.parseAllTodos();
        new Notice('Todos refreshed');
      }
    });

    // Add command to assign task to today
    this.addCommand({
      id: 'assign-task-to-today',
      name: 'Assign Current Line Task to Today',
      editorCallback: (editor) => {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        
        if (this.todoParser['isTodoLine'](line)) {
          // Add today's date tag to the line
          const today = new Date().toISOString().split('T')[0];
          const dateTag = this.settings.dateTagFormat.replace('%date%', today);
          const newLine = `${line} ${dateTag}`;
          editor.setLine(cursor.line, newLine);
          new Notice('Task assigned to today');
        } else {
          new Notice('Current line is not a todo item');
        }
      }
    });

    // Add command to create new task
    this.addCommand({
      id: 'create-new-task',
      name: 'Create New Task',
      editorCallback: (editor) => {
        const cursor = editor.getCursor();
        editor.replaceRange('- [ ] ', cursor);
        editor.setCursor(cursor.line, cursor.ch + 6);
      }
    });
  }

  private registerEventHandlers(): void {
    // File modification events
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.handleFileModified(file);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.handleFileCreated(file);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile) {
          this.handleFileDeleted(file);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        if (file instanceof TFile) {
          this.handleFileRenamed(file, oldPath);
        }
      })
    );
  }

  private async handleFileModified(file: TFile): Promise<void> {
    await this.parseFileForTodos(file);
    this.updateView();
  }

  private async handleFileCreated(file: TFile): Promise<void> {
    await this.parseFileForTodos(file);
    this.updateView();
  }

  private handleFileDeleted(file: TFile): void {
    this.todos.delete(file.path);
    this.updateView();
  }

  private async handleFileRenamed(file: TFile, oldPath: string): Promise<void> {
    this.todos.delete(oldPath);
    await this.parseFileForTodos(file);
    this.updateView();
  }

  private async parseAllTodos(): Promise<void> {
    const startTime = Date.now();
    this.todos.clear();
    
    const markdownFiles = this.app.vault.getMarkdownFiles();
    let totalTodos = 0;
    
    for (const file of markdownFiles) {
      const fileTodos = await this.parseFileForTodos(file);
      totalTodos += fileTodos.length;
    }
    
    const endTime = Date.now();
    console.log(`Parsed ${totalTodos} todos from ${markdownFiles.length} files in ${endTime - startTime}ms`);
    
    this.updateView();
  }

  private async parseFileForTodos(file: TFile): Promise<EnhancedTodoItem[]> {
    try {
      const content = await this.app.vault.cachedRead(file);
      const todos = await this.todoParser.parseEnhancedTodosInFile(file, content);
      
      // CRITICAL FIX: Store ALL todos in the map, don't filter here
      // Filtering should only happen in the view layer
      this.todos.set(file.path, todos);
      
      // Check for new problematic tasks (only incomplete ones)
      if (this.settings.enableTaskBreakdownAnalysis) {
        const incompleteTodos = todos.filter(todo => !todo.isCompleted);
        await this.checkNewTasksForIssues(incompleteTodos);
      }
      
      return todos;
    } catch (error) {
      console.error(`Error parsing todos from ${file.path}:`, error);
      return [];
    }
  }

  private async checkNewTasksForIssues(todos: EnhancedTodoItem[]): Promise<void> {
    if (!this.settings.enableTaskBreakdownAnalysis) return;
    
    const problematicTasks = todos.filter(todo => 
      TaskSuitabilityAnalyzer.needsImmediateBreakdown(todo)
    );
    
    if (problematicTasks.length > 0 && this.settings.autoShowBreakdownSuggestions) {
      // Show breakdown notification for problematic tasks
      this.showTaskBreakdownNotification(problematicTasks);
    }
  }

  private showTaskBreakdownNotification(tasks: EnhancedTodoItem[]): void {
    const taskTitles = tasks.map(t => t.title).join(', ');
    new Notice(
      `${tasks.length} task(s) need breakdown: ${taskTitles}. Check the Enhanced Todo view for suggestions.`,
      10000
    );
  }

  private async checkForProblematicTasks(): Promise<void> {
    if (!this.settings.enableTaskBreakdownAnalysis) return;
    
    const allTodos = this.getAllTodos();
    const problematicTasks = allTodos.filter(todo => 
      TaskSuitabilityAnalyzer.shouldSuggestBreakdown(todo)
    );
    
    if (problematicTasks.length > 0) {
      console.log(`Found ${problematicTasks.length} tasks that may need breakdown`);
    }
  }

  private scheduleEndOfDayCheck(): void {
    if (!this.settings.enableEndOfDayNotifications) return;
    
    // Clear existing timeout
    if (this.endOfDayTimeout) {
      clearTimeout(this.endOfDayTimeout);
    }
    
    // Schedule new end-of-day check
    this.endOfDayTimeout = this.scheduleManager.scheduleEndOfDayCheck(() => {
      this.performEndOfDayCheck();
    });
  }

  private async performEndOfDayCheck(): Promise<void> {
    const todaysTasks = this.getTodaysAssignedTasks();
    const incompleteTasks = todaysTasks.filter(task => !task.isCompleted);
    
    if (incompleteTasks.length > 0) {
      new Notice(
        `End of day: ${incompleteTasks.length} tasks remain incomplete. Check the Enhanced Todo view to reschedule.`,
        15000
      );
    }
    
    // Schedule tomorrow's check
    this.scheduleEndOfDayCheck();
  }

  private updateView(): void {
    if (this.view) {
      this.view.refresh();
    }
  }

  // Public API methods for the view
  public getAllTodos(): EnhancedTodoItem[] {
    const allTodos: EnhancedTodoItem[] = [];
    for (const todos of this.todos.values()) {
      allTodos.push(...todos);
    }
    return allTodos;
  }

  public getTodaysAssignedTasks(): EnhancedTodoItem[] {
    return this.getAllTodos().filter(todo => todo.isAssignedToday && !todo.isCompleted);
  }

  public getUnassignedTasks(): EnhancedTodoItem[] {
    return this.getAllTodos().filter(todo => !todo.isAssignedToday && !todo.isCompleted);
  }

  public getTasksByPriority(priority: TaskPriority): EnhancedTodoItem[] {
    return this.getAllTodos().filter(todo => todo.priority === priority && !todo.isCompleted);
  }

  public async toggleTaskStatus(todo: EnhancedTodoItem): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(todo.sourceFilePath) as TFile;
    if (!file) {
      new Notice('File not found for task');
      return;
    }
    
    try {
      const content = await this.app.vault.read(file);
      const lines = content.split('\n');
      
      if (lines[todo.lineNumber]) {
        const currentLine = lines[todo.lineNumber];
        const newStatus = todo.isCompleted ? '[ ]' : '[x]';
        const newLine = currentLine.replace(/\[[ x]\]/i, newStatus);
        lines[todo.lineNumber] = newLine;
        
        await this.app.vault.modify(file, lines.join('\n'));
        
        // Update todo status in memory
        if (todo.isCompleted) {
          todo.markTodo();
        } else {
          todo.markCompleted();
        }
        
        // CRITICAL FIX: Re-parse the file to update the todos map
        await this.parseFileForTodos(file);
        
        // CRITICAL FIX: Force view refresh
        this.updateView();
        
        // Show success notification
        const statusText = todo.isCompleted ? 'completed' : 'reopened';
        new Notice(`Task ${statusText}: ${todo.title}`);
        
      } else {
        new Notice('Task line not found in file');
      }
    } catch (error) {
      console.error('Error toggling task status:', error);
      new Notice('Failed to update task status');
      
      // Revert the todo status if file update failed
      if (todo.isCompleted) {
        todo.markTodo();
      } else {
        todo.markCompleted();
      }
    }
  }

  public async openTaskFile(todo: EnhancedTodoItem): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(todo.sourceFilePath) as TFile;
    if (!file) return;
    
    if (this.settings.openFilesInNewLeaf && this.app.workspace.getActiveFile()) {
      await this.app.workspace.splitActiveLeaf().openFile(file);
    } else {
      await this.app.workspace.getUnpinnedLeaf().openFile(file);
    }
    
    // TODO: Scroll to the specific line
  }

  public async assignTaskToToday(todo: EnhancedTodoItem): Promise<void> {
    todo.assignToToday();
    
    // Update the file to add today's date tag
    const file = this.app.vault.getAbstractFileByPath(todo.sourceFilePath) as TFile;
    if (!file) return;
    
    try {
      const content = await this.app.vault.read(file);
      const lines = content.split('\n');
      
      if (lines[todo.lineNumber]) {
        const today = new Date().toISOString().split('T')[0];
        const dateTag = this.settings.dateTagFormat.replace('%date%', today);
        lines[todo.lineNumber] += ` ${dateTag}`;
        
        await this.app.vault.modify(file, lines.join('\n'));
      }
    } catch (error) {
      console.error('Error assigning task to today:', error);
      new Notice('Failed to assign task to today');
    }
    
    this.updateView();
  }

  public async assignTaskToDate(todo: EnhancedTodoItem, date: Date): Promise<void> {
    // Import DateTime from luxon for proper date handling
    const { DateTime } = await import('luxon');
    const luxonDate = DateTime.fromJSDate(date);
    
    // Update the todo item's assigned date
    todo.assignToDate(luxonDate);
    
    // Update the file to add the date tag
    const file = this.app.vault.getAbstractFileByPath(todo.sourceFilePath) as TFile;
    if (!file) {
      throw new Error('File not found for task');
    }
    
    try {
      const content = await this.app.vault.read(file);
      const lines = content.split('\n');
      
      if (lines[todo.lineNumber]) {
        const currentLine = lines[todo.lineNumber];
        const dateStr = date.toISOString().split('T')[0];
        const dateTag = this.settings.dateTagFormat.replace('%date%', dateStr);
        
        // Remove existing date tags first (if any)
        const dateTagPattern = new RegExp(this.settings.dateTagFormat.replace('%date%', '\\d{4}-\\d{2}-\\d{2}'), 'g');
        const cleanedLine = currentLine.replace(dateTagPattern, '').trim();
        
        // Add the new date tag
        lines[todo.lineNumber] = `${cleanedLine} ${dateTag}`;
        
        await this.app.vault.modify(file, lines.join('\n'));
        
        // Re-parse the file to update the todos map
        await this.parseFileForTodos(file);
        
        // Force view refresh
        this.updateView();
        
      } else {
        throw new Error('Task line not found in file');
      }
    } catch (error) {
      console.error('Error assigning task to date:', error);
      throw error;
    }
  }

  public getSettings(): TodoPluginSettings {
    return this.settings;
  }

  public async updateSettings(newSettings: TodoPluginSettings): Promise<void> {
    this.settings = newSettings;
    await this.saveData(this.settings);
    
    // Update services with new settings
    this.todoParser.updateSettings(this.settings.dateTagFormat, this.settings.dateFormat);
    this.scheduleManager.updateSettings(this.settings.weeklySchedule);
    
    // Reschedule end-of-day check
    this.scheduleEndOfDayCheck();
    
    // Refresh todos if format settings changed
    await this.parseAllTodos();
  }

  public getScheduleManager(): WeeklyScheduleManager {
    return this.scheduleManager;
  }

  public getAutoFixSuggestions(todo: EnhancedTodoItem): { fixed: boolean; changes: string[] } {
    return TaskSuitabilityAnalyzer.autoFixSimpleIssues(todo);
  }

  public getBreakdownSuggestions(todo: EnhancedTodoItem): TaskBreakdownSuggestion[] {
    return TaskSuitabilityAnalyzer.suggestBreakdown(todo);
  }
}
