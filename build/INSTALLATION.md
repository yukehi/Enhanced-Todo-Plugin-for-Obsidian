# Enhanced Todo Plugin - Installation Instructions

This folder contains the built files needed to install and test the Enhanced Todo plugin in Obsidian.

## Files Included

- **main.js** (300KB) - The compiled plugin code
- **manifest.json** - Plugin metadata and configuration
- **styles.css** - Plugin styling and UI components

## Installation Steps

### Method 1: Manual Installation (Recommended for Testing)

1. **Locate your Obsidian vault's plugin folder:**
   - Navigate to your vault folder
   - Go to `.obsidian/plugins/` directory
   - If the `plugins` folder doesn't exist, create it

2. **Create the plugin folder:**
   - Inside `.obsidian/plugins/`, create a new folder named `enhanced-todo`
   - The full path should be: `[your-vault]/.obsidian/plugins/enhanced-todo/`

3. **Copy the plugin files:**
   - Copy all three files from this build folder into the `enhanced-todo` folder:
     - `main.js`
     - `manifest.json` 
     - `styles.css`

4. **Enable the plugin:**
   - Open Obsidian
   - Go to Settings → Community Plugins
   - Find "Enhanced Todo" in the installed plugins list
   - Toggle it ON

### Method 2: Using Obsidian's Plugin Folder

1. **Open Obsidian Settings:**
   - Go to Settings → Community Plugins
   - Click "Open plugins folder" button

2. **Create plugin directory:**
   - Create a new folder named `enhanced-todo`

3. **Copy files:**
   - Copy `main.js`, `manifest.json`, and `styles.css` into the `enhanced-todo` folder

4. **Restart Obsidian and enable the plugin**

## Testing the Plugin

Once installed and enabled, you can test the plugin by:

1. **Opening the Enhanced Todo View:**
   - Use Command Palette (Ctrl/Cmd + P)
   - Search for "Open Enhanced Todo View"
   - Or check the right sidebar for the todo panel

2. **Creating test todos in any markdown file:**
   ```markdown
   - [ ] Basic task
   - [ ] Urgent task #priority/A
   - [ ] Task due today #due/2024-12-29
   - [ ] Task with time estimate ⏱️30min
   ```

3. **Testing features:**
   - View filtering (Today, Scheduled, Inbox, All)
   - Priority filtering (A, B, C, D)
   - Task completion toggling
   - Settings configuration

## Plugin Features

- **Smart Priority Management** - Automatic priority assignment
- **Advanced Scheduling** - Date-based task organization
- **Intelligent Analysis** - Task breakdown suggestions
- **Multiple Views** - Flexible task filtering and organization
- **Statistics Dashboard** - Progress tracking and analytics

## Troubleshooting

- **Plugin not appearing:** Restart Obsidian after installation
- **No tasks showing:** Create some todo items in markdown files
- **Styling issues:** Ensure `styles.css` is in the plugin folder
- **Errors in console:** Check that all three files are present and properly copied

## Plugin Information

- **Plugin ID:** enhanced-todo
- **Version:** 1.0.0
- **Minimum Obsidian Version:** 1.4.0
- **Author:** aleksey zgeria
- **License:** MIT

For more detailed documentation, see the main README.md file in the project repository.
