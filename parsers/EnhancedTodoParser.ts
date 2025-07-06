import { TFile } from 'obsidian';
import { EnhancedTodoItem, SubTask } from '../models/EnhancedTodoItem';
import { TaskPriority, TodoItemStatus } from '../constants';
import { AutoPriorityAssigner } from '../services/AutoPriorityAssigner';

export interface ParsedTodoData {
  title: string;
  description: string;
  status: TodoItemStatus;
  tags: string[];
  manualPriority?: TaskPriority;
  dueDate?: string;
  startIndex: number;
  length: number;
}

export class EnhancedTodoParser {
  private dateTagFormat: string;
  private dateFormat: string;

  constructor(dateTagFormat: string = '#%date%', dateFormat: string = 'yyyy-MM-dd') {
    this.dateTagFormat = dateTagFormat;
    this.dateFormat = dateFormat;
  }

  // Parse all todos from a file
  async parseEnhancedTodosInFile(file: TFile, content: string): Promise<EnhancedTodoItem[]> {
    const lines = content.split('\n');
    const todos: EnhancedTodoItem[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (this.isTodoLine(line)) {
        const todo = await this.parseEnhancedTodoLine(line, file.path, i, content);
        if (todo) {
          todos.push(todo);
        }
      }
    }
    
    return todos;
  }

  // Parse a single todo line with enhanced features
  async parseEnhancedTodoLine(
    line: string, 
    filePath: string, 
    lineNumber: number,
    fileContent: string
  ): Promise<EnhancedTodoItem | null> {
    
    if (!this.isTodoLine(line)) return null;
    
    // Parse basic todo info
    const basicData = this.parseBasicTodoData(line, lineNumber);
    
    // Parse subtasks with complexity analysis
    const subtasks = AutoPriorityAssigner.parseSubtasksWithComplexity(fileContent, lineNumber);
    const subtaskCount = subtasks.length;
    
    // Auto-assign priority based on subtask count
    const autoPriority = AutoPriorityAssigner.assignPriorityBySubtaskCount(subtaskCount);
    
    // Check for manual priority override in tags
    const manualPriority = this.extractManualPriority(line);
    const finalPriority = manualPriority || autoPriority;
    const isAutoPriority = !manualPriority;
    
    // Create enhanced todo item
    const todo = new EnhancedTodoItem(
      this.generateTodoId(filePath, lineNumber),
      basicData.title,
      basicData.description,
      finalPriority,
      filePath,
      lineNumber,
      basicData.startIndex,
      basicData.length,
      basicData.status,
      subtasks,
      isAutoPriority
    );
    
    // Set parent task ID for subtasks
    subtasks.forEach(subtask => {
      subtask.parentTaskId = todo.id;
    });
    
    // Parse and set additional metadata
    todo.tags = basicData.tags;
    
    // Parse due date if present
    const dueDate = await this.extractDueDate(line);
    if (dueDate) {
      todo.assignToDate(dueDate);
    }
    
    // Check if task should be assigned to today based on daily note context
    if (this.isDailyNote(filePath) && !dueDate) {
      const dailyNoteDate = this.extractDateFromDailyNote(filePath);
      if (dailyNoteDate) {
        todo.assignToDate(dailyNoteDate);
      }
    }
    
    return todo;
  }

  // Check if line contains a todo item
  private isTodoLine(line: string): boolean {
    return /^\s*[-*]\s+\[[ x]\]/.test(line);
  }

  // Parse basic todo data from line
  private parseBasicTodoData(line: string, lineNumber: number): ParsedTodoData {
    const trimmedLine = line.trim();
    const startIndex = line.indexOf(trimmedLine);
    
    // Extract status
    const isCompleted = /\[x\]/i.test(trimmedLine);
    const status = isCompleted ? TodoItemStatus.Done : TodoItemStatus.Todo;
    
    // Extract title and description
    let content = trimmedLine.replace(/^\s*[-*]\s*\[[x ]\]\s*/i, '');
    
    // Extract tags
    const tags = this.extractTags(content);
    
    // Remove tags from content for cleaner title
    const cleanContent = content.replace(/#[\w\/\-]+/g, '').trim();
    
    // Split title and description (first line vs rest)
    const parts = cleanContent.split('\n');
    const title = parts[0].trim();
    const description = parts.slice(1).join('\n').trim();
    
    return {
      title,
      description,
      status,
      tags,
      startIndex,
      length: line.length
    };
  }

  // Extract manual priority from tags like #priority/A
  private extractManualPriority(line: string): TaskPriority | null {
    const priorityMatch = line.match(/#priority\/([ABCD])/i);
    if (priorityMatch) {
      return priorityMatch[1].toUpperCase() as TaskPriority;
    }
    
    // Also check for simple priority tags like #A, #B, etc.
    const simplePriorityMatch = line.match(/#([ABCD])(?!\w)/i);
    if (simplePriorityMatch) {
      return simplePriorityMatch[1].toUpperCase() as TaskPriority;
    }
    
    return null;
  }

  // Extract all tags from content
  private extractTags(content: string): string[] {
    const tagMatches = content.match(/#[\w\/\-]+/g);
    return tagMatches || [];
  }

  // Extract due date from content
  private async extractDueDate(content: string): Promise<any | null> {
    // Try to match date tags based on format
    const dateTagPattern = this.dateTagFormat.replace('%date%', '([\\d\\-\\/]+)');
    const dateMatch = content.match(new RegExp(dateTagPattern));
    
    if (dateMatch) {
      try {
        // Import DateTime from luxon for proper date handling
        const { DateTime } = await import('luxon');
        const dateStr = dateMatch[1];
        const luxonDate = DateTime.fromISO(dateStr);
        if (luxonDate.isValid) {
          return luxonDate;
        }
      } catch (error) {
        console.warn('Failed to parse date:', dateMatch[1]);
      }
    }
    
    // Also try to find standalone dates
    const standaloneDate = content.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (standaloneDate) {
      try {
        const { DateTime } = await import('luxon');
        const luxonDate = DateTime.fromISO(standaloneDate[1]);
        if (luxonDate.isValid) {
          return luxonDate;
        }
      } catch (error) {
        console.warn('Failed to parse standalone date:', standaloneDate[1]);
      }
    }
    
    return null;
  }

  // Check if file is a daily note
  private isDailyNote(filePath: string): boolean {
    // Simple heuristic - check if filename looks like a date
    const filename = filePath.split('/').pop()?.replace('.md', '') || '';
    return /^\d{4}-\d{2}-\d{2}$/.test(filename) || 
           /^\d{2}-\d{2}-\d{4}$/.test(filename) ||
           /^\d{4}\d{2}\d{2}$/.test(filename);
  }

  // Extract date from daily note filename
  private extractDateFromDailyNote(filePath: string): any | null {
    const filename = filePath.split('/').pop()?.replace('.md', '') || '';
    
    // Try different date formats
    if (/^\d{4}-\d{2}-\d{2}$/.test(filename)) {
      return filename; // YYYY-MM-DD
    }
    
    if (/^\d{2}-\d{2}-\d{4}$/.test(filename)) {
      const parts = filename.split('-');
      return `${parts[2]}-${parts[0]}-${parts[1]}`; // Convert MM-DD-YYYY to YYYY-MM-DD
    }
    
    if (/^\d{4}\d{2}\d{2}$/.test(filename)) {
      return `${filename.slice(0,4)}-${filename.slice(4,6)}-${filename.slice(6,8)}`; // YYYYMMDD to YYYY-MM-DD
    }
    
    return null;
  }

  // Generate unique ID for todo
  private generateTodoId(filePath: string, lineNumber: number): string {
    const fileHash = this.simpleHash(filePath);
    return `todo_${fileHash}_${lineNumber}_${Date.now()}`;
  }

  // Simple hash function for file paths
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Parse parent/child relationships from tags
  parseParentChildRelationships(todos: EnhancedTodoItem[]): void {
    const parentMap = new Map<string, EnhancedTodoItem>();
    
    // First pass: identify parent tasks
    todos.forEach(todo => {
      const parentTag = todo.tags.find(tag => tag.startsWith('#parent/'));
      if (parentTag) {
        const parentId = parentTag.replace('#parent/', '');
        parentMap.set(parentId, todo);
      }
    });
    
    // Second pass: link children to parents
    todos.forEach(todo => {
      const childTag = todo.tags.find(tag => tag.startsWith('#child/'));
      if (childTag) {
        const parentId = childTag.replace('#child/', '');
        const parent = parentMap.get(parentId);
        if (parent) {
          todo.parentTaskId = parent.id;
          parent.childTaskIds.push(todo.id);
        }
      }
    });
  }

  // Parse project tags for grouping
  parseProjectTags(todos: EnhancedTodoItem[]): Map<string, EnhancedTodoItem[]> {
    const projectMap = new Map<string, EnhancedTodoItem[]>();
    
    todos.forEach(todo => {
      const projectTags = todo.tags.filter(tag => 
        tag.startsWith('#project/') || 
        tag.startsWith('#work/') || 
        tag.startsWith('#personal/')
      );
      
      if (projectTags.length === 0) {
        // Add to "uncategorized" project
        if (!projectMap.has('uncategorized')) {
          projectMap.set('uncategorized', []);
        }
        projectMap.get('uncategorized')!.push(todo);
      } else {
        projectTags.forEach(projectTag => {
          if (!projectMap.has(projectTag)) {
            projectMap.set(projectTag, []);
          }
          projectMap.get(projectTag)!.push(todo);
        });
      }
    });
    
    return projectMap;
  }

  // Update parser settings
  updateSettings(dateTagFormat: string, dateFormat: string): void {
    this.dateTagFormat = dateTagFormat;
    this.dateFormat = dateFormat;
  }

  // Validate todo format
  validateTodoFormat(line: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (!this.isTodoLine(line)) {
      issues.push('Line is not a valid todo format');
      suggestions.push('Use format: - [ ] Task description');
      return { isValid: false, issues, suggestions };
    }
    
    const content = line.replace(/^\s*[-*]\s*\[[x ]\]\s*/i, '');
    
    if (content.trim().length === 0) {
      issues.push('Todo has no description');
      suggestions.push('Add a meaningful task description');
    }
    
    if (content.length > 200) {
      issues.push('Todo description is very long');
      suggestions.push('Consider breaking into subtasks or shortening description');
    }
    
    // Check for potential formatting issues
    if (content.includes('TODO:') || content.includes('FIXME:')) {
      suggestions.push('Consider removing TODO:/FIXME: prefixes as the checkbox already indicates it\'s a task');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  // Generate todo line from EnhancedTodoItem
  generateTodoLine(todo: EnhancedTodoItem): string {
    const checkbox = todo.isCompleted ? '[x]' : '[ ]';
    let line = `- ${checkbox} ${todo.title}`;
    
    // Add description if present
    if (todo.description) {
      line += ` ${todo.description}`;
    }
    
    // Add manual priority tag if set
    if (!todo.isAutoPriority) {
      line += ` #priority/${todo.priority}`;
    }
    
    // Add other tags
    todo.tags.forEach(tag => {
      if (!tag.startsWith('#priority/')) {
        line += ` ${tag}`;
      }
    });
    
    // Add due date if assigned
    if (todo.assignedDate) {
      const dateStr = todo.assignedDate.toISODate();
      line += ` ${this.dateTagFormat.replace('%date%', dateStr || '')}`;
    }
    
    return line;
  }
}
