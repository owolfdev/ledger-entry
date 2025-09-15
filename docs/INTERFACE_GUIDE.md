# Interface Guide

This document describes the user interface elements and how to interact with the Ledger Entry application.

## Header Navigation

The top header contains the main navigation and controls:

### Left Side

- **Ledger Entry** (clickable) - Returns to the home page
- **Docs** - Opens the documentation section

### Right Side

- **Layout Toggles** - Control which panels are visible
- **Auth Button** - Sign in/out functionality

## Layout Toggles

The layout toggles behave differently on mobile vs desktop:

### Desktop (≥ 768px width)

- **Terminal Toggle** (terminal icon) - Show/hide terminal panel
- **Editor Toggle** (document icon) - Show/hide editor panel
- Both panels can be visible simultaneously
- Cannot hide both panels at once

### Mobile (< 768px width)

- **Single Toggle Button** - Switches between terminal and editor
- Shows current panel icon (terminal or document)
- Only one panel visible at a time
- Always keeps one panel active

## Main Interface

The main interface consists of two resizable panels:

### Terminal Panel

- **Command Input** - Type ledger commands here
- **Command History** - Use ↑/↓ arrows to navigate previous commands
- **Output Logs** - Shows command results and status messages
- **Clear Button** - Clears the output logs

### Editor Panel

- **Monaco Editor** - Full-featured code editor for ledger files
- **File Header** - Shows filename and modification status
- **Vim Mode Toggle** - Enable/disable Vim keybindings
- **Save Button** - Save current file
- **Status Bar** - Shows cursor position and line count

## Keyboard Shortcuts

### Panel Navigation

- `Cmd+Shift+`` - Toggle focus between Editor and Terminal
- `Cmd+Shift+E` - Focus Editor (shows panel if hidden)
- `Cmd+Shift+T` - Focus Terminal (shows panel if hidden)

### Editor Shortcuts

- `Cmd+S` - Save file
- `Cmd+Z` - Undo
- `Cmd+Y` - Redo
- `Cmd+F` - Find
- `Cmd+A` - Select All

### Terminal Shortcuts

- `Enter` - Execute command
- `Shift+Enter` - New line in command input
- `↑/↓` - Navigate command history

## Responsive Design

### Desktop Layout

- Resizable panels with drag handle
- Both panels can be visible simultaneously
- Full keyboard shortcuts available
- Hover states and detailed tooltips

### Mobile Layout

- Single panel view only
- Touch-optimized controls
- Simplified navigation
- Larger touch targets

## Visual States

### Panel States

- **Visible** - Panel is shown and active
- **Hidden** - Panel is not visible (desktop only)
- **Focused** - Panel has keyboard focus
- **Modified** - Editor content has unsaved changes

### Button States

- **Default** - Active/selected state
- **Ghost** - Inactive/unselected state
- **Hover** - Mouse over state
- **Disabled** - Non-interactive state

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation support
- High contrast mode support
- Screen reader friendly
- Focus indicators visible

## Tips for Usage

1. **Quick Panel Switching** - Use `Cmd+Shift+`` to quickly switch between panels
2. **Mobile Navigation** - Single toggle button shows current panel and switches to the other
3. **Command History** - Use arrow keys in terminal to repeat previous commands
4. **Vim Mode** - Enable for advanced text editing in the editor
5. **Resize Panels** - Drag the handle between panels on desktop to adjust sizes
