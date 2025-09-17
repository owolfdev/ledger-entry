# Ledger Interface Migration Package

This package contains the terminal, editor, and header components from the Ledger Entry application, ready for migration to your existing project with Supabase auth and GitHub integration.

## Components Included

### Core Components

- **`LedgerInterface`** - Main interface with terminal and editor panels
- **`LayoutToggles`** - Panel visibility controls (desktop/mobile responsive)
- **`MobileNav`** - Mobile navigation component

### Context & Hooks

- **`LayoutProvider`** - Layout state management context
- **`useLayout`** - Hook for accessing layout state
- **`useSettings`** - Settings persistence hook

### UI Components

- Button, Badge, ScrollArea, DropdownMenu components
- All necessary Radix UI primitives

## Dependencies

The package requires these dependencies to be installed in your target project:

```json
{
  "@monaco-editor/react": "^4.7.0",
  "@radix-ui/react-dropdown-menu": "2.1.4",
  "@radix-ui/react-scroll-area": "latest",
  "@radix-ui/react-slot": "1.1.1",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "lucide-react": "^0.454.0",
  "monaco-editor": "^0.52.2",
  "monaco-vim": "^0.4.2",
  "react-resizable-panels": "^2.1.7",
  "tailwind-merge": "^2.5.5",
  "tailwindcss-animate": "^1.0.7"
}
```

## Migration Steps

### 1. Copy Components

Copy the following directories to your target project:

- `components/` → `src/components/ledger/`
- `contexts/` → `src/contexts/`
- `hooks/` → `src/hooks/`
- `lib/` → `src/lib/` (merge with existing utils)
- `types/` → `src/types/`

### 2. Install Dependencies

```bash
npm install @monaco-editor/react @radix-ui/react-dropdown-menu @radix-ui/react-scroll-area @radix-ui/react-slot class-variance-authority clsx lucide-react monaco-editor monaco-vim react-resizable-panels tailwind-merge tailwindcss-animate
```

### 3. Update Import Paths

Update all import paths in the copied components to match your project structure:

**From:**

```typescript
import { useLayout } from "../contexts/layout-context";
import { Button } from "./ui/button";
```

**To:**

```typescript
import { useLayout } from "@/src/contexts/layout-context";
import { Button } from "@/src/components/ui/button";
```

### 4. Integrate with Your Layout

Replace the header section in your main layout with:

```tsx
// In your layout.tsx
import { LayoutProvider } from "@/src/contexts/layout-context";
import { LayoutToggles } from "@/src/components/ledger/layout-toggles";
import { MobileNav } from "@/src/components/ledger/mobile-nav";
// Import your existing auth component
import { YourAuthButton } from "@/src/components/your-auth-button";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <LayoutProvider>
          <div className="min-h-screen flex flex-col">
            {/* Header with Layout Toggles and Auth Button */}
            <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
              <div className="px-6 py-3 flex items-center">
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-baseline gap-6">
                  <Link
                    href="/"
                    className="text-xl font-bold hover:text-primary transition-colors"
                  >
                    Your App Name
                  </Link>
                  <Link
                    href="/docs"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Docs
                  </Link>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden flex items-center gap-4">
                  <MobileNav />
                  <Link
                    href="/"
                    className="text-xl font-bold hover:text-primary transition-colors"
                  >
                    Your App Name
                  </Link>
                </div>

                {/* Right Side Controls */}
                <div className="ml-auto flex items-center gap-4">
                  <LayoutToggles />
                  <YourAuthButton />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">{children}</main>
          </div>
        </LayoutProvider>
      </body>
    </html>
  );
}
```

### 5. Use the Ledger Interface

In your main page component:

```tsx
import LedgerInterface from "@/src/components/ledger/ledger-interface";

export default function Home() {
  return (
    <div className="h-screen">
      <LedgerInterface />
    </div>
  );
}
```

## Key Features

### Terminal Panel

- Command input with history navigation (↑/↓ arrows)
- Command execution with ledger-specific commands
- Output logging with timestamps
- Clear terminal functionality

### Editor Panel

- Monaco Editor with ledger syntax highlighting
- Vim mode support (toggleable)
- File modification tracking
- Cursor position display
- Auto-save functionality

### Layout Management

- Resizable panels (desktop)
- Mobile-responsive single panel toggle
- Keyboard shortcuts:
  - `Cmd+Shift+E` - Focus Editor
  - `Cmd+Shift+T` - Focus Terminal
  - `Cmd+Shift+\`` - Toggle between panels

### Settings Persistence

- Panel visibility preferences
- Vim mode settings
- Splitter ratio preferences
- All settings saved to localStorage

## Customization

### Styling

The components use Tailwind CSS classes and can be customized by:

1. Modifying the component files directly
2. Overriding classes in your global CSS
3. Using CSS variables for theme customization

### Commands

The terminal supports these built-in commands:

- `balance` / `bal` - Show account balances
- `accounts` - List all accounts
- `add transaction` - Add transaction template
- `save` - Save current file
- `validate` - Validate ledger entries
- `clear` - Clear terminal output
- `help` - Show available commands

You can extend the command system by modifying the `executeCommand` function in `ledger-interface.tsx`.

## Notes

- The components are designed to work with Next.js 15+ and React 19+
- Monaco Editor requires browser-only APIs, so it uses dynamic imports
- Vim mode is optional and can be disabled
- All components are fully responsive and mobile-friendly
- The package assumes you have Tailwind CSS configured in your project

## Troubleshooting

### Common Issues

1. **Monaco Editor not loading**: Ensure you're using dynamic imports and `ssr: false`
2. **Vim mode not working**: Check that monaco-vim is properly installed and imported
3. **Styling issues**: Verify Tailwind CSS is configured and all required classes are available
4. **Import errors**: Double-check all import paths match your project structure

### Support

If you encounter issues during migration, check:

1. All dependencies are installed
2. Import paths are correct
3. Your project has the required Tailwind CSS configuration
4. The LayoutProvider wraps your app components
