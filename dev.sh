#!/bin/bash
# Plura local development script

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=${PORT:-3000}

# Editor preference: zed, code, cursor, or none
EDITOR_CMD="${EDITOR_CMD:-code}"

echo "Starting Plura development environment..."
echo "Project: $PROJECT_DIR"
echo "Port: $PORT"

# Open in editor if available and not set to "none"
if [[ "$EDITOR_CMD" != "none" ]] && command -v "$EDITOR_CMD" &> /dev/null; then
    echo "Opening in $EDITOR_CMD..."
    "$EDITOR_CMD" "$PROJECT_DIR"
fi

# Check if node_modules exists
if [[ ! -d "$PROJECT_DIR/node_modules" ]]; then
    echo "Installing dependencies..."
    npm install
fi

# Generate Prisma client if needed
if [[ ! -d "$PROJECT_DIR/node_modules/.prisma" ]]; then
    echo "Generating Prisma client..."
    npx prisma generate
fi

# Start dev server
echo "Starting Next.js dev server on http://localhost:$PORT"
npm run dev
