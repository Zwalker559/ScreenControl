#!/bin/bash

# Setup script for local image generation backend
# This script installs dependencies and downloads the model

set -e  # Exit on error

echo "🚀 Setting up local image generation backend..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    echo "   Download from: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo "✅ Found Python $PYTHON_VERSION"
echo ""

# Create virtual environment
echo "📦 Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "🔄 Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "✅ Dependencies installed!"
echo ""

# Download model
echo "🤖 Downloading Stable Diffusion 2.1 model..."
echo "   This may take 5-15 minutes on the first run (~5GB download)"
echo ""

mkdir -p models

python3 << 'EOF'
import os
from diffusers import StableDiffusionPipeline
import torch

model_id = "stabilityai/stable-diffusion-2-1"
model_path = "./models/stable-diffusion-2-1"

if os.path.exists(model_path):
    print(f"✅ Model already cached at {model_path}")
else:
    print(f"⬇️  Downloading model {model_id}...")
    print(f"   Device: {'CUDA (GPU)' if torch.cuda.is_available() else 'CPU'}")
    print("   Note: GPU is MUCH faster. First run may take a while on CPU.")
    print("")
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    pipeline = StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        safety_checker=None,
    )
    
    print(f"💾 Saving model to {model_path}...")
    os.makedirs(model_path, exist_ok=True)
    pipeline.save_pretrained(model_path)
    
    print("✅ Model downloaded and cached successfully!")

print("")
print("🎉 Setup complete! You can now run the server with:")
print("   python server.py")
print("")
print("   Or use the run script:")
print("   bash run_server.sh")
EOF

if [ $? -eq 0 ]; then
    echo "✅ Model setup complete!"
else
    echo "⚠️  Model download had issues. Check your internet and disk space."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next steps:"
echo "   1. Copy .env.local.example to .env.local:"
echo "      cp .env.local.example .env.local"
echo ""
echo "   2. Start the backend server:"
echo "      bash run_server.sh"
echo ""
echo "   3. In another terminal, start the frontend:"
echo "      npm run dev"
echo ""
echo "   4. Open http://localhost:5173 and click '🎨 Generate Image'"
echo ""
