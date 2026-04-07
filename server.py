"""
Local Image Generation Server using HuggingFace Diffusers
Runs Stable Diffusion models locally without API costs
"""

import os
import io
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import torch
from PIL import Image

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
MODEL_ID = os.getenv('LOCAL_MODEL_ID', 'stabilityai/stable-diffusion-2-1')
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_PATH = os.getenv('LOCAL_MODEL_PATH', './models/stable-diffusion-2-1')

# Global pipeline (loaded once)
pipeline = None

def load_pipeline():
    """Load or use cached pipeline"""
    global pipeline
    
    if pipeline is not None:
        return pipeline
    
    print(f"Loading model from {MODEL_PATH} on device: {DEVICE}...")
    
    try:
        # Check if model exists locally
        if os.path.exists(MODEL_PATH):
            print(f"Loading from local cache: {MODEL_PATH}")
            pipeline = StableDiffusionPipeline.from_pretrained(
                MODEL_PATH,
                torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
                safety_checker=None,  # Disable safety checker for flexibility
            )
        else:
            print(f"Downloading model from HuggingFace: {MODEL_ID}")
            pipeline = StableDiffusionPipeline.from_pretrained(
                MODEL_ID,
                torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
                safety_checker=None,
            )
            # Save locally for future use
            os.makedirs(MODEL_PATH, exist_ok=True)
            print(f"Saving model to {MODEL_PATH}...")
            pipeline.save_pretrained(MODEL_PATH)
        
        # Move to device
        pipeline = pipeline.to(DEVICE)
        
        # Optional: Use faster scheduler
        pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
            pipeline.scheduler.config
        )
        
        print("Model loaded successfully!")
        return pipeline
    
    except Exception as e:
        print(f"Error loading model: {e}")
        raise

def image_to_base64(image):
    """Convert PIL image to base64 string"""
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    img_bytes = buffer.getvalue()
    return base64.b64encode(img_bytes).decode()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'device': DEVICE,
        'model_id': MODEL_ID,
        'cuda_available': torch.cuda.is_available(),
    })

@app.route('/generate', methods=['POST'])
def generate_image():
    """Generate image from prompt"""
    try:
        data = request.json
        prompt = data.get('prompt', '')
        
        if not prompt or not prompt.strip():
            return jsonify({'error': 'Prompt is required'}), 400
        
        # Optional parameters
        num_inference_steps = int(data.get('num_inference_steps', 20))
        guidance_scale = float(data.get('guidance_scale', 7.5))
        height = int(data.get('height', 512))
        width = int(data.get('width', 512))
        seed = data.get('seed', None)
        
        # Validate parameters
        if num_inference_steps < 10 or num_inference_steps > 100:
            return jsonify({'error': 'num_inference_steps must be between 10-100'}), 400
        if guidance_scale < 1 or guidance_scale > 20:
            return jsonify({'error': 'guidance_scale must be between 1-20'}), 400
        
        print(f"Generating image with prompt: {prompt}")
        
        # Load pipeline if needed
        pipeline = load_pipeline()
        
        # Set seed for reproducibility
        if seed:
            generator = torch.Generator(device=DEVICE).manual_seed(int(seed))
        else:
            generator = None
        
        # Generate image
        with torch.no_grad():
            image = pipeline(
                prompt,
                height=height,
                width=width,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator,
            ).images[0]
        
        # Convert to base64
        img_base64 = image_to_base64(image)
        
        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'prompt': prompt,
            'height': height,
            'width': width,
            'num_inference_steps': num_inference_steps,
            'guidance_scale': guidance_scale,
        })
    
    except Exception as e:
        print(f"Error generating image: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/models', methods=['GET'])
def list_models():
    """List available models"""
    return jsonify({
        'current_model': MODEL_ID,
        'local_path': MODEL_PATH,
        'available_models': [
            'stabilityai/stable-diffusion-2-1',
            'stabilityai/stable-diffusion-2',
            'runwayml/stable-diffusion-v1-5',
            'prompthero/openjourney-v4',
        ],
        'device': DEVICE,
    })

@app.route('/download', methods=['POST'])
def download_model():
    """Download a model to local cache"""
    try:
        data = request.json
        model_id = data.get('model_id', MODEL_ID)
        
        print(f"Downloading model: {model_id}")
        
        # Reset pipeline so it reloads
        global pipeline
        old_pipeline = pipeline
        pipeline = None
        
        # Download
        pipeline = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
            safety_checker=None,
        )
        
        # Save locally
        os.makedirs(MODEL_PATH, exist_ok=True)
        pipeline.save_pretrained(MODEL_PATH)
        
        pipeline = pipeline.to(DEVICE)
        
        return jsonify({
            'success': True,
            'message': f'Model {model_id} downloaded and cached',
            'path': MODEL_PATH,
        })
    
    except Exception as e:
        print(f"Error downloading model: {e}")
        # Restore old pipeline if available
        if old_pipeline:
            pipeline = old_pipeline
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Pre-load model on startup
    try:
        load_pipeline()
        print("✅ Server ready for image generation!")
    except Exception as e:
        print(f"⚠️ Warning: Could not pre-load model: {e}")
        print("Model will be loaded on first request...")
    
    # Run server
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        use_reloader=False  # Important: disable reloader to avoid loading model twice
    )
