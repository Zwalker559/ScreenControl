#!/bin/bash

# Run the local image generation server

set -e

echo "🚀 Starting local image generation server..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run setup first:"
    echo "   bash setup_backend.sh"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local (you can customize if needed)"
fi

# Start server
echo "📡 Starting Flask server on http://localhost:5000"
echo ""
echo "✅ Server is running!"
echo "   Press Ctrl+C to stop"
echo ""
echo "💡 In another terminal, start the frontend with:"
echo "   npm run dev"
echo ""

python server.py
