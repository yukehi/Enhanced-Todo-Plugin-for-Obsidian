import { EnhancedTodoItem, TaskSuitabilityResult, TaskSuitabilityIssue } from '../models/EnhancedTodoItem';
import { TaskPriority, PRIORITY_TIME_RATIOS } from '../constants';
import { AutoPriorityAssigner } from './AutoPriorityAssigner';

export enum RescheduleAction {
  PROCEED = 'proceed',
  BREAK_DOWN = 'breakdown', 
  CHANGE_PRIORITY = 'priority',
  DELETE = 'delete',
  CANCEL = 'cancel'
}

export interface TaskBreakdownSuggestion {
  title: string;
  priority: TaskPriority;
  subtasks: string[];
  estimatedTime: number;
  reasoning: string;
}

export class TaskSuitabilityAnalyzer {
  // Analyze if task fits well into priority system
  static analyzeTaskSuitability(task: EnhancedTodoItem): TaskSuitabilityResult {
    const issues: TaskSuitabilityIssue[] = [];
    
    // Check for problematic patterns
    if (this.isTooComplexForSingleTask(task)) {
      issues.push({
        type: 'TOO_COMPLEX',
        severity: 'HIGH',
        message: 'Task appears too complex for a single priority assignment',
        suggestion: 'Break into smaller, more manageable subtasks'
      });
    }
    
    if (this.hasInconsistentSubtaskComplexity(task)) {
      issues.push({
        type: 'INCONSISTENT_COMPLEXITY',
        severity: 'MEDIUM', 
        message: 'Subtasks vary greatly in complexity',
        suggestion: 'Group similar complexity subtasks or split complex ones'
      });
    }
    
    if (this.exceedsTimeAllocationLimits(task)) {
      issues.push({
        type: 'TIME_MISMATCH',
        severity: 'HIGH',
        message: 'Task time requirements don\'t match priority allocation',
        suggestion: 'Adjust subtasks to fit priority time blocks'
      });
    }
    
    return {
      isProblematic: issues.length > 0,
      issues,
      recommendedAction: this.getRecommendedAction(issues)
    };
  }
  
  // Detect overly complex tasks
  private static isTooComplexForSingleTask(task: EnhancedTodoItem): boolean {
    // Task has too many subtasks for any priority level
    if (task.subtaskCount > 10) return true;
    
    // Task description contains complexity indicators
    const complexityKeywords = [
      'research', 'analyze', 'design', 'implement', 'test', 'deploy',
      'multiple', 'various', 'several', 'comprehensive', 'complete',
      'system', 'platform', 'architecture', 'infrastructure'
    ];
    
    const content = `${task.title} ${task.description}`.toLowerCase();
    const hasMultipleComplexKeywords = complexityKeywords
      .filter(keyword => content.includes(keyword))
      .length >= 3;
    
    return hasMultipleComplexKeywords;
  }
  
  // Check if subtasks have inconsistent complexity
  private static hasInconsistentSubtaskComplexity(task: EnhancedTodoItem): boolean {
    if (task.subtasks.length < 3) return false;
    
    const complexityScores = task.subtasks.map(subtask => subtask.complexity);
    
    const maxScore = Math.max(...complexityScores);
    const minScore = Math.min(...complexityScores);
    
    // If complexity varies by more than 3 levels, it's inconsistent
    return (maxScore - minScore) > 3;
  }
  
  // Check if task time doesn't match priority allocation
  private static exceedsTimeAllocationLimits(task: EnhancedTodoItem): boolean {
    const allocation = PRIORITY_TIME_RATIOS[task.priority].timePerTask;
    const estimatedTime = this.estimateTaskTime(task);
    
    // If estimated time is more than 50% over allocation, it's problematic
    return estimatedTime > (allocation * 1.5);
  }
  
  // Estimate total task time based on subtasks
  private static estimateTaskTime(task: EnhancedTodoItem): number {
    if (task.subtasks.length === 0) {
      return 30; // Default estimate for single task
    }
    
    return task.subtasks.reduce((total, subtask) => {
      return total + (subtask.complexity * 10); // 10 minutes per complexity point
    }, 0);
  }
  
  // Get recommended action based on issues
  private static getRecommendedAction(issues: TaskSuitabilityIssue[]): 'required' | 'suggested' | 'none' {
    const highSeverityIssues = issues.filter(i => i.severity === 'HIGH');
    
    if (highSeverityIssues.length > 0) {
      return 'required';
    }
    
    if (issues.length > 0) {
      return 'suggested';
    }
    
    return 'none';
  }

  // Generate breakdown suggestions
  static suggestBreakdown(task: EnhancedTodoItem): TaskBreakdownSuggestion[] {
    const suggestions: TaskBreakdownSuggestion[] = [];
    
    // Group subtasks by complexity and type
    const groupedSubtasks = this.groupSubtasksByType(task.subtasks);
    
    for (const [groupType, subtasks] of groupedSubtasks.entries()) {
      if (subtasks.length >= 2) {
        const suggestedPriority = this.suggestPriorityForGroup(subtasks);
        
        suggestions.push({
          title: `${task.title} - ${groupType}`,
          priority: suggestedPriority,
          subtasks: subtasks.map(st => st.title),
          estimatedTime: PRIORITY_TIME_RATIOS[suggestedPriority].timePerTask,
          reasoning: `Grouped ${subtasks.length} ${groupType.toLowerCase()} tasks`
        });
      }
    }
    
    // If no good groupings, suggest splitting by complexity
    if (suggestions.length === 0 && task.subtasks.length > 6) {
      suggestions.push(...this.suggestComplexityBasedBreakdown(task));
    }
    
    return suggestions;
  }
  
  // Group subtasks by type/complexity
  private static groupSubtasksByType(subtasks: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    subtasks.forEach(subtask => {
      const type = this.categorizeSubtask(subtask.title);
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(subtask);
    });
    
    return groups;
  }
  
  // Categorize subtask by type
  private static categorizeSubtask(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.match(/(design|wireframe|mockup|layout|ui|ux|visual)/)) {
      return 'Design';
    }
    if (lowerTitle.match(/(implement|code|develop|build|create|program)/)) {
      return 'Implementation';
    }
    if (lowerTitle.match(/(test|verify|check|validate|qa|debug)/)) {
      return 'Testing';
    }
    if (lowerTitle.match(/(research|analyze|investigate|study|explore)/)) {
      return 'Research';
    }
    if (lowerTitle.match(/(document|write|update|record|note)/)) {
      return 'Documentation';
    }
    if (lowerTitle.match(/(plan|organize|schedule|prepare|setup)/)) {
      return 'Planning';
    }
    if (lowerTitle.match(/(deploy|release|publish|launch|install)/)) {
      return 'Deployment';
    }
    
    return 'General';
  }

  // Suggest priority for a group of subtasks
  private static suggestPriorityForGroup(subtasks: any[]): TaskPriority {
    const avgComplexity = subtasks.reduce((sum, st) => sum + st.complexity, 0) / subtasks.length;
    const count = subtasks.length;
    
    // High complexity or many subtasks = higher priority
    if (avgComplexity >= 4 || count >= 6) return TaskPriority.A;
    if (avgComplexity >= 3 || count >= 4) return TaskPriority.B;
    if (avgComplexity >= 2 || count >= 2) return TaskPriority.C;
    return TaskPriority.D;
  }

  // Suggest breakdown based on complexity levels
  private static suggestComplexityBasedBreakdown(task: EnhancedTodoItem): TaskBreakdownSuggestion[] {
    const suggestions: TaskBreakdownSuggestion[] = [];
    
    // Group by complexity levels
    const highComplexity = task.subtasks.filter(st => st.complexity >= 4);
    const mediumComplexity = task.subtasks.filter(st => st.complexity >= 2 && st.complexity < 4);
    const lowComplexity = task.subtasks.filter(st => st.complexity < 2);
    
    if (highComplexity.length > 0) {
      suggestions.push({
        title: `${task.title} - Complex Tasks`,
        priority: TaskPriority.A,
        subtasks: highComplexity.map(st => st.title),
        estimatedTime: 30,
        reasoning: `${highComplexity.length} high-complexity tasks requiring focused attention`
      });
    }
    
    if (mediumComplexity.length > 0) {
      const priority = mediumComplexity.length >= 4 ? TaskPriority.B : TaskPriority.C;
      suggestions.push({
        title: `${task.title} - Standard Tasks`,
        priority,
        subtasks: mediumComplexity.map(st => st.title),
        estimatedTime: PRIORITY_TIME_RATIOS[priority].timePerTask,
        reasoning: `${mediumComplexity.length} medium-complexity tasks`
      });
    }
    
    if (lowComplexity.length > 0) {
      suggestions.push({
        title: `${task.title} - Quick Tasks`,
        priority: TaskPriority.C,
        subtasks: lowComplexity.map(st => st.title),
        estimatedTime: 10,
        reasoning: `${lowComplexity.length} simple tasks that can be done quickly`
      });
    }
    
    return suggestions;
  }

  // Check if task needs immediate breakdown
  static needsImmediateBreakdown(task: EnhancedTodoItem): boolean {
    const analysis = this.analyzeTaskSuitability(task);
    return analysis.recommendedAction === 'required';
  }

  // Check if task should show breakdown suggestion
  static shouldSuggestBreakdown(task: EnhancedTodoItem): boolean {
    const analysis = this.analyzeTaskSuitability(task);
    return analysis.recommendedAction === 'suggested' || analysis.recommendedAction === 'required';
  }

  // Get breakdown urgency level
  static getBreakdownUrgency(task: EnhancedTodoItem): 'none' | 'low' | 'medium' | 'high' {
    const analysis = this.analyzeTaskSuitability(task);
    
    if (analysis.recommendedAction === 'required') {
      return 'high';
    }
    
    if (analysis.recommendedAction === 'suggested') {
      const highSeverityIssues = analysis.issues.filter(i => i.severity === 'HIGH');
      const mediumSeverityIssues = analysis.issues.filter(i => i.severity === 'MEDIUM');
      
      if (highSeverityIssues.length > 0) return 'high';
      if (mediumSeverityIssues.length > 0) return 'medium';
      return 'low';
    }
    
    return 'none';
  }

  // Generate breakdown summary for UI
  static generateBreakdownSummary(task: EnhancedTodoItem): string {
    const analysis = this.analyzeTaskSuitability(task);
    
    if (!analysis.isProblematic) {
      return 'Task structure looks good for the current priority system.';
    }
    
    const issueCount = analysis.issues.length;
    const highSeverityCount = analysis.issues.filter(i => i.severity === 'HIGH').length;
    
    let summary = `Found ${issueCount} issue${issueCount > 1 ? 's' : ''}`;
    
    if (highSeverityCount > 0) {
      summary += ` (${highSeverityCount} high priority)`;
    }
    
    summary += '. ';
    
    if (analysis.recommendedAction === 'required') {
      summary += 'Task breakdown is required before assignment.';
    } else {
      summary += 'Consider breaking down this task for better time management.';
    }
    
    return summary;
  }

  // Auto-fix simple issues
  static autoFixSimpleIssues(task: EnhancedTodoItem): {
    fixed: boolean;
    changes: string[];
  } {
    const changes: string[] = [];
    let fixed = false;
    
    // Auto-fix priority mismatch
    const correctPriority = AutoPriorityAssigner.assignPriorityBySubtaskCount(task.subtaskCount);
    if (task.priority !== correctPriority && task.isAutoPriority) {
      task.updatePriority(correctPriority, false);
      changes.push(`Updated priority from ${task.priority} to ${correctPriority}`);
      fixed = true;
    }
    
    // Auto-fix time allocation
    const estimatedTime = this.estimateTaskTime(task);
    if (Math.abs(task.estimatedTime - estimatedTime) > 10) {
      task.estimatedTime = estimatedTime;
      changes.push(`Updated estimated time to ${estimatedTime} minutes`);
      fixed = true;
    }
    
    return { fixed, changes };
  }
}
