# Keyboard Shortcuts

This document lists all keyboard shortcuts available in the Ledger Entry application.

## Panel Navigation

| Shortcut      | Action         | Description                                      |
| ------------- | -------------- | ------------------------------------------------ |
| `Cmd+Shift+`` | Toggle Focus   | Switch focus between Editor and Terminal         |
| `Cmd+Shift+E` | Focus Editor   | Focus the Monaco Editor (shows panel if hidden)  |
| `Cmd+Shift+T` | Focus Terminal | Focus the Terminal input (shows panel if hidden) |

## Editor Shortcuts

The Monaco Editor supports standard text editing shortcuts plus Vim mode when enabled:

| Shortcut      | Action         | Description              |
| ------------- | -------------- | ------------------------ |
| `Cmd+S`       | Save           | Save current file        |
| `Cmd+Z`       | Undo           | Undo last change         |
| `Cmd+Y`       | Redo           | Redo last change         |
| `Cmd+F`       | Find           | Open find dialog         |
| `Cmd+G`       | Find Next      | Find next occurrence     |
| `Cmd+Shift+G` | Find Previous  | Find previous occurrence |
| `Cmd+A`       | Select All     | Select all text          |
| `Cmd+/`       | Toggle Comment | Toggle line comment      |

## Vim Mode

When Vim mode is enabled (toggle with the "Vim ON/OFF" button), the editor supports standard Vim keybindings:

| Mode   | Keys     | Action         | Description                            |
| ------ | -------- | -------------- | -------------------------------------- |
| Normal | `i`      | Insert Mode    | Enter insert mode                      |
| Normal | `a`      | Append         | Enter insert mode after cursor         |
| Normal | `o`      | New Line       | Insert new line below                  |
| Normal | `O`      | New Line Above | Insert new line above                  |
| Normal | `x`      | Delete Char    | Delete character under cursor          |
| Normal | `dd`     | Delete Line    | Delete current line                    |
| Normal | `yy`     | Yank Line      | Copy current line                      |
| Normal | `p`      | Paste          | Paste after cursor                     |
| Normal | `P`      | Paste Before   | Paste before cursor                    |
| Normal | `u`      | Undo           | Undo last change                       |
| Normal | `Ctrl+r` | Redo           | Redo last change                       |
| Normal | `gg`     | Go to Top      | Move to beginning of file              |
| Normal | `G`      | Go to Bottom   | Move to end of file                    |
| Normal | `:w`     | Write          | Save file                              |
| Normal | `:q`     | Quit           | Exit (not applicable in web editor)    |
| Normal | `:wq`    | Write and Quit | Save and exit                          |
| Normal | `Esc`    | Normal Mode    | Return to normal mode from insert mode |

## Terminal Shortcuts

| Shortcut      | Action          | Description                           |
| ------------- | --------------- | ------------------------------------- |
| `Enter`       | Execute Command | Run the current command               |
| `Shift+Enter` | New Line        | Add new line in command input         |
| `↑`           | Command History | Navigate up in command history        |
| `↓`           | Command History | Navigate down in command history      |
| `Tab`         | Auto-complete   | Auto-complete commands (if available) |

## Layout Shortcuts

| Shortcut              | Action          | Description              |
| --------------------- | --------------- | ------------------------ |
| Click Terminal Toggle | Toggle Terminal | Show/hide terminal panel |
| Click Editor Toggle   | Toggle Editor   | Show/hide editor panel   |

## Notes

- All shortcuts use `Cmd` on macOS and `Ctrl` on Windows/Linux
- Panel focus shortcuts will automatically show hidden panels
- Vim mode can be toggled on/off using the "Vim ON/OFF" button in the editor header
- The application prevents both panels from being hidden simultaneously
