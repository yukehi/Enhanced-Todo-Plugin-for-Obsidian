# Contributing to Enhanced Todo Plugin

Thank you for your interest in contributing to the Enhanced Todo Plugin! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Obsidian (for testing)
- TypeScript knowledge
- Familiarity with Obsidian Plugin API

### Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd enhanced-todo-plugin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. For development with hot reload:
   ```bash
   npm run dev
   ```

### Project Structure

```
enhanced-todo-plugin/
├── main.ts                 # Main plugin entry point
├── manifest.json          # Plugin manifest
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── esbuild.config.mjs     # Build configuration
├── styles.css             # Plugin styles
├── constants.ts           # Shared constants
├── models/                # Data models
│   ├── EnhancedTodoItem.ts
│   └── TodoPluginSettings.ts
├── services/              # Business logic services
│   ├── AutoPriorityAssigner.ts
│   └── TaskSuitabilityAnalyzer.ts
├── parsers/               # Todo parsing logic
│   └── EnhancedTodoParser.ts
├── views/                 # UI views
│   └── EnhancedTodoView.ts
└── ui/                    # UI components
    └── EnhancedSettingsTab.ts
```

## How to Contribute

### Reporting Issues

1. Check existing issues to avoid duplicates
2. Use the issue template if available
3. Provide clear reproduction steps
4. Include relevant system information (OS, Obsidian version, plugin version)
5. Add screenshots or logs when helpful

### Suggesting Features

1. Check if the feature has already been requested
2. Clearly describe the feature and its benefits
3. Provide use cases and examples
4. Consider implementation complexity

### Code Contributions

#### Before You Start

1. Fork the repository
2. Create a feature branch from `main`
3. Ensure your development environment is set up

#### Development Guidelines

##### Code Style

- Use TypeScript for all new code
- Follow existing code formatting and style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

##### Architecture Principles

- **Separation of Concerns**: Keep UI, business logic, and data separate
- **Single Responsibility**: Each class/function should have one clear purpose
- **Dependency Injection**: Use constructor injection for dependencies
- **Error Handling**: Always handle errors gracefully
- **Performance**: Consider performance implications, especially for large vaults

##### Testing

- Test your changes thoroughly in different scenarios
- Test with various vault sizes and structures
- Verify compatibility with different Obsidian versions
- Test edge cases and error conditions

#### Pull Request Process

1. **Create a Pull Request**:
   - Use a descriptive title
   - Reference related issues
   - Provide a clear description of changes
   - Include screenshots for UI changes

2. **Code Review**:
   - Address reviewer feedback promptly
   - Keep discussions constructive and professional
   - Be open to suggestions and improvements

3. **Before Merging**:
   - Ensure all tests pass
   - Update documentation if needed
   - Squash commits if requested

### Specific Contribution Areas

#### Adding New Features

When adding new features:

1. **Plan the Implementation**:
   - Consider how it fits with existing architecture
   - Think about user experience and settings
   - Plan for backward compatibility

2. **Update Documentation**:
   - Update README.md with new features
   - Add settings documentation
   - Include usage examples

3. **Consider Settings**:
   - Add appropriate settings for customization
   - Provide sensible defaults
   - Update the settings tab UI

#### Bug Fixes

When fixing bugs:

1. **Understand the Root Cause**:
   - Reproduce the issue consistently
   - Identify the underlying problem
   - Consider edge cases

2. **Test Thoroughly**:
   - Verify the fix works in various scenarios
   - Ensure no regressions are introduced
   - Test with different configurations

#### Performance Improvements

When optimizing performance:

1. **Measure First**:
   - Profile the current performance
   - Identify actual bottlenecks
   - Set measurable goals

2. **Consider Trade-offs**:
   - Balance performance vs. code complexity
   - Consider memory usage implications
   - Maintain feature functionality

### Code Examples

#### Adding a New Service

```typescript
// services/NewService.ts
export class NewService {
  constructor(private settings: TodoPluginSettings) {}
  
  public processData(data: any): ProcessedData {
    // Implementation
  }
}

// main.ts - Register the service
private newService: NewService;

async onload(): Promise<void> {
  // ... existing code
  this.newService = new NewService(this.settings);
}
```

#### Adding a New Setting

```typescript
// models/TodoPluginSettings.ts
export interface TodoPluginSettings {
  // ... existing settings
  newFeatureEnabled: boolean;
}

export const DEFAULT_SETTINGS: TodoPluginSettings = {
  // ... existing defaults
  newFeatureEnabled: true,
};

// ui/EnhancedSettingsTab.ts
new Setting(containerEl)
  .setName('Enable new feature')
  .setDesc('Description of the new feature')
  .addToggle(toggle => toggle
    .setValue(this.plugin.getSettings().newFeatureEnabled)
    .onChange(async (value) => {
      const settings = this.plugin.getSettings();
      settings.newFeatureEnabled = value;
      await this.plugin.updateSettings(settings);
    }));
```

## Development Tips

### Debugging

1. **Use Console Logging**:
   ```typescript
   console.log('Debug info:', data);
   ```

2. **Obsidian Developer Tools**:
   - Open with Ctrl+Shift+I (Cmd+Opt+I on Mac)
   - Check console for errors and logs

3. **Plugin Reloading**:
   - Use Ctrl+P → "Reload app without saving" for quick testing

### Testing in Obsidian

1. **Create a Test Vault**:
   - Use a separate vault for development
   - Include various todo formats and structures
   - Test with different file sizes

2. **Manual Testing Checklist**:
   - [ ] Plugin loads without errors
   - [ ] Settings save and load correctly
   - [ ] All view modes work properly
   - [ ] Task operations (toggle, assign, etc.) work
   - [ ] Performance is acceptable with large files
   - [ ] No console errors during normal usage

## Community Guidelines

### Communication

- Be respectful and constructive in all interactions
- Ask questions if you're unsure about anything
- Help others when you can
- Follow the project's code of conduct

### Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor statistics

## Getting Help

If you need help:

1. Check existing documentation and issues
2. Ask questions in GitHub discussions
3. Reach out to maintainers for guidance
4. Join the community chat if available

## Release Process

For maintainers:

1. **Version Bumping**:
   - Update version in `manifest.json` and `package.json`
   - Follow semantic versioning (MAJOR.MINOR.PATCH)

2. **Release Notes**:
   - Document all changes since last release
   - Include breaking changes prominently
   - Credit contributors

3. **Testing**:
   - Test the release build thoroughly
   - Verify installation process
   - Check compatibility

Thank you for contributing to the Enhanced Todo Plugin! Your contributions help make task management in Obsidian better for everyone.
