#!/bin/bash

# Ledger Interface Migration Script
# This script helps copy the components to your target project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Ledger Interface Migration Script${NC}"
echo "=================================="

# Check if target directory is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide the target project directory${NC}"
    echo "Usage: ./migrate.sh /path/to/your/project"
    exit 1
fi

TARGET_DIR="$1"

# Check if target directory exists
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}Error: Target directory does not exist: $TARGET_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}Target project: $TARGET_DIR${NC}"

# Create necessary directories
echo "Creating directories..."
mkdir -p "$TARGET_DIR/src/components/ledger"
mkdir -p "$TARGET_DIR/src/contexts"
mkdir -p "$TARGET_DIR/src/hooks"
mkdir -p "$TARGET_DIR/src/types"

# Copy components
echo "Copying components..."
cp -r components/* "$TARGET_DIR/src/components/ledger/"
cp -r contexts/* "$TARGET_DIR/src/contexts/"
cp -r hooks/* "$TARGET_DIR/src/hooks/"
cp -r types/* "$TARGET_DIR/src/types/"

# Copy lib utils (merge with existing)
echo "Copying utilities..."
if [ -f "$TARGET_DIR/src/lib/utils.ts" ]; then
    echo -e "${YELLOW}Warning: utils.ts already exists. Please merge manually.${NC}"
    cp lib/utils.ts "$TARGET_DIR/src/lib/utils-ledger.ts"
else
    mkdir -p "$TARGET_DIR/src/lib"
    cp lib/utils.ts "$TARGET_DIR/src/lib/"
fi

# Copy header template
echo "Copying header template..."
cp components/header-template.tsx "$TARGET_DIR/src/components/ledger/header.tsx"

echo -e "${GREEN}Migration completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Install dependencies: npm install @monaco-editor/react @radix-ui/react-dropdown-menu @radix-ui/react-scroll-area @radix-ui/react-slot class-variance-authority clsx lucide-react monaco-editor monaco-vim react-resizable-panels tailwind-merge tailwindcss-animate"
echo "2. Update import paths in the copied components"
echo "3. Replace the placeholder auth component in header.tsx"
echo "4. Integrate the LayoutProvider in your main layout"
echo "5. Use LedgerInterface in your main page component"
echo ""
echo "See README.md for detailed integration instructions."
