#!/bin/bash

# Auto-start both frontend (Vite) and backend (Flask) servers
# This script ensures both the web app and image generation API are running

set -e

PYTHON_PID=""
VITE_PID=""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Cleanup function to kill both processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    
    if [ ! -z "$PYTHON_PID" ]; then
        kill $PYTHON_PID 2>/dev/null || true
        wait $PYTHON_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$VITE_PID" ]; then
        kill $VITE_PID 2>/dev/null || true
        wait $VITE_PID 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ Servers stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${GREEN}🚀 ZeowAI - Starting all services...${NC}"
echo ""

# Setup Python backend if needed
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found, setting up...${NC}"
    bash setup_backend.sh
    echo ""
fi

# Activate Python virtual environment and start Flask server
echo -e "${GREEN}📡 Starting image generation API on port 5000...${NC}"
source venv/bin/activate

# Start Flask server in background
python server.py > /tmp/flask-server.log 2>&1 &
PYTHON_PID=$!

# Wait a moment for Flask to start
sleep 3

# Check if Flask server started successfully
if ! kill -0 $PYTHON_PID 2>/dev/null; then
    echo -e "${RED}✗ Failed to start image generation API${NC}"
    cat /tmp/flask-server.log
    exit 1
fi

echo -e "${GREEN}✓ Image generation API started (PID: $PYTHON_PID)${NC}"
echo ""

# Start Vite dev server in foreground
echo -e "${GREEN}🎨 Starting frontend on port 5173...${NC}"
npm run dev &
VITE_PID=$!

echo ""
echo -e "${GREEN}✓ ZeowAI is ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}API:      http://localhost:5000${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for both processes
wait
