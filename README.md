# Enhanced Todo Plugin for Obsidian

An advanced todo management plugin for Obsidian that extends the basic todo functionality with intelligent features, priority management, scheduling, and task breakdown analysis.

## Features

### 🎯 Smart Priority Management
- **Automatic Priority Assignment**: Tasks are automatically assigned priorities (A, B, C, D) based on keywords and context
- **Priority-based Organization**: Tasks are grouped and displayed by priority level
- **Visual Priority Indicators**: Color-coded priority indicators and emojis for quick identification

### 📅 Advanced Scheduling
- **Today's Tasks**: Dedicated view for tasks assigned to today
- **Weekly Schedule Management**: Configure work hours and end-of-day times for each day
- **Date Tag Support**: Flexible date tagging system with customizable formats
- **Overdue Detection**: Automatic detection and highlighting of overdue tasks

### 🧠 Intelligent Task Analysis
- **Task Breakdown Suggestions**: AI-powered analysis suggests when tasks should be broken down
- **Complexity Detection**: Identifies overly complex tasks that need simplification
- **Auto-fix Suggestions**: Provides automatic fixes for common task issues
- **Reschedule Warnings**: Tracks and warns about frequently rescheduled tasks

### 📊 Enhanced Views and Filtering
- **Multiple View Modes**: Today, Scheduled, Inbox, and All tasks views
- **Priority Filtering**: Filter tasks by specific priority levels
- **Progress Tracking**: Visual progress bars for tasks with subtasks
- **Statistics Dashboard**: Real-time statistics on task completion and productivity

### 🔔 Smart Notifications
- **End-of-day Notifications**: Reminders about incomplete tasks at day's end
- **Task Breakdown Alerts**: Notifications when tasks need attention
- **Customizable Timing**: Configure notification schedules per your workflow

### ⚙️ Extensive Customization
- **Flexible Date Formats**: Customize how dates are formatted and tagged
- **Priority Keywords**: Define custom keywords that trigger priority assignment
- **Time Allocation**: Set default time estimates for tasks
- **Weekly Schedule**: Configure work hours for each day of the week

## Installation

### From Obsidian Community Plugins
1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Enhanced Todo"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release from GitHub
2. Extract the files to your vault's `.obsidian/plugins/enhanced-todo/` directory
3. Enable the plugin in Obsidian settings

## Usage

### Basic Todo Syntax
The plugin works with standard Obsidian todo syntax:
```markdown
- [ ] Basic task
- [x] Completed task
- [ ] Task with priority #priority/A
- [ ] Task due today #due/2024-01-15
- [ ] Urgent task with time estimate ⏱️30min
```

### Priority System
Tasks are automatically assigned priorities based on keywords:
- **Priority A (🔴)**: Critical, urgent tasks
- **Priority B (🟡)**: Important tasks
- **Priority C (🟢)**: Normal tasks
- **Priority D (⚪)**: Low priority tasks

### Date Tags
Use date tags to schedule tasks:
```markdown
- [ ] Review document #due/2024-01-15
- [ ] Call client #due/today
- [ ] Weekly meeting #due/2024-01-20
```

### Time Allocation
Add time estimates to tasks:
```markdown
- [ ] Write report ⏱️60min
- [ ] Quick email ⏱️5min
- [ ] Research project ⏱️120min
```

### Subtasks
Create subtasks for complex tasks:
```markdown
- [ ] Plan vacation
  - [ ] Book flights
  - [ ] Reserve hotel
  - [ ] Plan itinerary
```

## Commands

The plugin adds several commands to Obsidian:

- **Open Enhanced Todo View**: Opens the main todo management interface
- **Refresh All Todos**: Manually refresh and reparse all todos
- **Assign Current Line Task to Today**: Quickly assign the task on current line to today
- **Create New Task**: Insert a new todo item at cursor position

## Settings

### General Settings
- **Show completed tasks**: Display completed tasks in views
- **Open files in new leaf**: Open task files in new panes
- **Auto-assign priority**: Enable automatic priority assignment

### Date Format Settings
- **Date tag format**: Customize how date tags appear (e.g., `#due/%date%`)
- **Date format**: Set the date format used in tags (e.g., `YYYY-MM-DD`)

### Priority Settings
- **Priority keywords**: Define keywords that trigger automatic priority assignment
- **Default task time**: Set default time allocation for new tasks

### Weekly Schedule
Configure work hours and end-of-day times for each day of the week.

### Notifications
- **End-of-day notifications**: Enable/disable daily completion reminders
- **Auto-show breakdown suggestions**: Automatically show task breakdown suggestions

### Advanced Settings
- **Task breakdown analysis**: Enable intelligent task analysis
- **Max reschedule warnings**: Set threshold for reschedule warnings
- **Task complexity threshold**: Define when tasks are considered complex

## Task Breakdown Analysis

The plugin includes intelligent analysis that helps identify problematic tasks:

### When Tasks Need Breakdown
- Tasks with very long descriptions
- Tasks that have been rescheduled multiple times
- Tasks with vague or unclear objectives
- Tasks that seem to contain multiple sub-objectives

### Auto-fix Suggestions
The plugin can automatically suggest fixes for:
- Missing time estimates
- Unclear task descriptions
- Missing priority assignments
- Improperly formatted date tags

### Breakdown Suggestions
When a task needs breakdown, the plugin suggests:
- Specific subtasks based on the main task
- Appropriate priorities for each subtask
- Time estimates for individual components
- Logical sequencing of subtasks

## Views and Interface

### Main Todo View
The main interface provides:
- **Filter buttons**: Quick access to different task views
- **Priority groups**: Tasks organized by priority level
- **Task actions**: Quick actions for each task (edit, assign to today, open file)
- **Progress indicators**: Visual progress for tasks with subtasks
- **Statistics panel**: Overview of task completion and productivity

### Task Display
Each task shows:
- **Checkbox**: Toggle completion status
- **Title and priority**: Task name with priority indicator
- **Time allocation**: Estimated time to complete
- **Due date**: When the task is due (if assigned)
- **Reschedule count**: How many times the task has been moved
- **Breakdown warnings**: Alerts when tasks need attention
- **Action buttons**: Quick access to common actions

## Tips and Best Practices

### Effective Priority Management
1. Use priority keywords in task descriptions
2. Review and adjust priorities regularly
3. Focus on Priority A tasks first
4. Don't overload any single priority level

### Smart Scheduling
1. Assign realistic time estimates
2. Use the weekly schedule feature to match your availability
3. Review overdue tasks regularly
4. Break down large tasks before scheduling

### Task Breakdown
1. Keep individual tasks focused on single objectives
2. Use subtasks for complex projects
3. Pay attention to breakdown suggestions
4. Regularly review and refactor task lists

### Productivity Optimization
1. Use the statistics panel to track progress
2. Set up end-of-day notifications
3. Review reschedule warnings to identify problematic tasks
4. Customize settings to match your workflow

## Troubleshooting

### Common Issues

**Tasks not appearing in views**
- Check if the task syntax is correct
- Ensure the file is saved
- Try refreshing the todo view

**Priority not assigned automatically**
- Verify priority keywords in settings
- Check if auto-assign priority is enabled
- Ensure keywords appear in task description

**Date tags not working**
- Verify date tag format in settings
- Check date format configuration
- Ensure dates are in the correct format

**Performance issues with large vaults**
- The plugin indexes all markdown files
- Consider excluding large directories if needed
- Use the refresh command sparingly

## Contributing

Contributions are welcome! Please see the [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Based on the original [Obsidian Todo Plugin](https://github.com/larslockefeer/obsidian-plugin-todo)
- Inspired by productivity methodologies like GTD and Eisenhower Matrix
- Built with the Obsidian Plugin API

## Changelog

### Version 1.0.0
- Initial release with enhanced todo management
- Smart priority assignment
- Advanced scheduling features
- Task breakdown analysis
- Comprehensive settings and customization
- Multiple view modes and filtering
- Statistics and progress tracking
