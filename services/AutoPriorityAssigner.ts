import { TaskPriority, AUTO_PRIORITY_THRESHOLDS } from '../constants';
import { EnhancedTodoItem, SubTask } from '../models/EnhancedTodoItem';

export class AutoPriorityAssigner {
  // Automatically assign priority based on number of subtasks
  static assignPriorityBySubtaskCount(subtaskCount: number): TaskPriority {
    if (subtaskCount >= AUTO_PRIORITY_THRESHOLDS.PRIORITY_A) return TaskPriority.A;
    if (subtaskCount >= AUTO_PRIORITY_THRESHOLDS.PRIORITY_B) return TaskPriority.B;
    if (subtaskCount >= AUTO_PRIORITY_THRESHOLDS.PRIORITY_C) return TaskPriority.C;
    return TaskPriority.D;
  }
  
  // Parse subtasks from markdown structure
  static parseSubtasks(content: string, startLine: number): string[] {
    const lines = content.split('\n');
    const subtasks: string[] = [];
    let currentLine = startLine + 1;
    
    // Look for indented subtasks after main task
    while (currentLine < lines.length) {
      const line = lines[currentLine];
      
      // Check if it's an indented subtask (- [ ] or * [ ] with indentation)
      if (line.match(/^\s+[-*]\s+\[[ x]\]/)) {
        subtasks.push(line.trim());
        currentLine++;
      } else if (line.trim() === '' || line.match(/^\s*$/)) {
        // Skip empty lines
        currentLine++;
      } else {
        // Stop when we hit non-subtask content
        break;
      }
    }
    
    return subtasks;
  }

  // Parse subtasks with complexity analysis
  static parseSubtasksWithComplexity(content: string, startLine: number): SubTask[] {
    const subtaskLines = this.parseSubtasks(content, startLine);
    const subtasks: SubTask[] = [];
    
    subtaskLines.forEach((line, index) => {
      const complexity = this.calculateSubtaskComplexity(line);
      const isCompleted = line.includes('[x]') || line.includes('[X]');
      const title = line.replace(/^\s*[-*]\s*\[[x ]\]\s*/i, '').trim();
      
      subtasks.push({
        id: `subtask_${startLine}_${index}`,
        title,
        isCompleted,
        parentTaskId: '', // Will be set by parent
        complexity
      });
    });
    
    return subtasks;
  }

  // Calculate individual subtask complexity (1-5 scale)
  static calculateSubtaskComplexity(subtaskTitle: string): number {
    const title = subtaskTitle.toLowerCase();
    let complexity = 1;
    
    // Simple actions (complexity +0)
    if (title.match(/^(check|verify|confirm|send|email|call|read)/)) {
      return 1;
    }
    
    // Medium actions (complexity +1)
    if (title.match(/(update|fix|edit|write|create|add|remove)/)) {
      complexity += 1;
    }
    
    // Complex actions (complexity +2)
    if (title.match(/(design|implement|develop|analyze|research|build)/)) {
      complexity += 2;
    }
    
    // Very complex actions (complexity +3)
    if (title.match(/(architect|optimize|refactor|integrate|deploy)/)) {
      complexity += 3;
    }
    
    // Additional complexity indicators
    if (title.includes('multiple') || title.includes('various') || title.includes('several')) {
      complexity += 1;
    }
    
    if (title.includes('complex') || title.includes('advanced') || title.includes('comprehensive')) {
      complexity += 1;
    }
    
    return Math.min(complexity, 5);
  }

  // Analyze if auto-assigned priority makes sense
  static validateAutoPriority(task: EnhancedTodoItem): {
    isValid: boolean;
    suggestedPriority?: TaskPriority;
    reason?: string;
  } {
    const subtaskCount = task.subtaskCount;
    const currentPriority = task.priority;
    const suggestedPriority = this.assignPriorityBySubtaskCount(subtaskCount);
    
    if (currentPriority === suggestedPriority) {
      return { isValid: true };
    }
    
    // Check if manual override makes sense
    if (!task.isAutoPriority) {
      // Allow manual overrides, but provide feedback
      return {
        isValid: true,
        suggestedPriority,
        reason: `Manual priority ${currentPriority} set, but ${suggestedPriority} would be auto-assigned based on ${subtaskCount} subtasks`
      };
    }
    
    // Auto-priority doesn't match - this shouldn't happen, but handle it
    return {
      isValid: false,
      suggestedPriority,
      reason: `Priority ${currentPriority} doesn't match expected ${suggestedPriority} for ${subtaskCount} subtasks`
    };
  }

  // Get priority color for UI
  static getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.A: return '#ff4757'; // Red
      case TaskPriority.B: return '#ffa502'; // Orange
      case TaskPriority.C: return '#2ed573'; // Green
      case TaskPriority.D: return '#747d8c'; // Gray
      default: return '#747d8c';
    }
  }

  // Get priority emoji for UI
  static getPriorityEmoji(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.A: return '🔴';
      case TaskPriority.B: return '🟡';
      case TaskPriority.C: return '🟢';
      case TaskPriority.D: return '⚪';
      default: return '⚪';
    }
  }

  // Get priority description
  static getPriorityDescription(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.A: return 'High Priority (30min each, 6+ subtasks)';
      case TaskPriority.B: return 'Medium-High Priority (30min each, 4+ subtasks)';
      case TaskPriority.C: return 'Medium Priority (10min each, 2+ subtasks)';
      case TaskPriority.D: return 'Low Priority (60min each, 0-1 subtasks)';
      default: return 'Unknown Priority';
    }
  }

  // Suggest priority based on task content analysis
  static suggestPriorityFromContent(title: string, description: string): {
    suggestedPriority: TaskPriority;
    confidence: number; // 0-1
    reasoning: string;
  } {
    const content = `${title} ${description}`.toLowerCase();
    let priorityScore = 0;
    const reasons: string[] = [];
    
    // Analyze urgency keywords
    if (content.match(/(urgent|asap|immediately|critical|emergency)/)) {
      priorityScore += 3;
      reasons.push('Contains urgency keywords');
    }
    
    // Analyze complexity keywords
    if (content.match(/(complex|comprehensive|multiple|various|several)/)) {
      priorityScore += 2;
      reasons.push('Contains complexity indicators');
    }
    
    // Analyze action complexity
    if (content.match(/(design|implement|develop|analyze|research|build|architect)/)) {
      priorityScore += 2;
      reasons.push('Contains complex action verbs');
    }
    
    // Analyze scope keywords
    if (content.match(/(project|system|platform|infrastructure|architecture)/)) {
      priorityScore += 1;
      reasons.push('Large scope indicators');
    }
    
    // Simple tasks
    if (content.match(/(check|verify|confirm|send|email|call|read|update)/)) {
      priorityScore -= 1;
      reasons.push('Contains simple action verbs');
    }
    
    // Determine priority based on score
    let suggestedPriority: TaskPriority;
    let confidence: number;
    
    if (priorityScore >= 4) {
      suggestedPriority = TaskPriority.A;
      confidence = 0.8;
    } else if (priorityScore >= 2) {
      suggestedPriority = TaskPriority.B;
      confidence = 0.7;
    } else if (priorityScore >= 0) {
      suggestedPriority = TaskPriority.C;
      confidence = 0.6;
    } else {
      suggestedPriority = TaskPriority.D;
      confidence = 0.5;
    }
    
    return {
      suggestedPriority,
      confidence,
      reasoning: reasons.join(', ') || 'Based on content analysis'
    };
  }

  // Update task priority with auto-assignment
  static updateTaskPriority(task: EnhancedTodoItem, forceRecalculate: boolean = false): boolean {
    if (!task.isAutoPriority && !forceRecalculate) {
      return false; // Don't override manual priority
    }
    
    const newPriority = this.assignPriorityBySubtaskCount(task.subtaskCount);
    
    if (task.priority !== newPriority) {
      task.updatePriority(newPriority, false); // false = auto-assigned
      return true;
    }
    
    return false;
  }

  // Batch update priorities for multiple tasks
  static batchUpdatePriorities(tasks: EnhancedTodoItem[]): EnhancedTodoItem[] {
    const updatedTasks: EnhancedTodoItem[] = [];
    
    tasks.forEach(task => {
      if (this.updateTaskPriority(task)) {
        updatedTasks.push(task);
      }
    });
    
    return updatedTasks;
  }
}
