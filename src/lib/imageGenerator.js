/**
 * Image Generation Service
 * Uses local Python backend with HuggingFace Diffusers models
 */

const LOCAL_API_URL = import.meta.env.VITE_LOCAL_IMAGE_API || 'http://localhost:5000';

/**
 * Generate an image using local API
 * @param {string} prompt - The image prompt/description
 * @param {Object} options - Generation options
 * @returns {Promise<Blob>} Image blob
 */
export async function generateImage(prompt, options = {}) {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Please provide a prompt for image generation');
  }

  try {
    const response = await fetch(`${LOCAL_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        num_inference_steps: options.num_inference_steps || 20,
        guidance_scale: options.guidance_scale || 7.5,
        height: options.height || 512,
        width: options.width || 512,
        seed: options.seed || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to generate image: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Image generation failed');
    }

    // Convert base64 to blob
    const base64Data = data.image.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: 'image/png' });
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

/**
 * Check if local API is available
 * @returns {Promise<boolean>}
 */
export async function checkLocalAPI() {
  try {
    const response = await fetch(`${LOCAL_API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get API status and info
 * @returns {Promise<Object>}
 */
export async function getAPIStatus() {
  try {
    const response = await fetch(`${LOCAL_API_URL}/health`);
    if (!response.ok) throw new Error('API unavailable');
    return await response.json();
  } catch (error) {
    return {
      status: 'unavailable',
      error: error.message,
    };
  }
}

/**
 * Convert blob to data URL for preview
 * @param {Blob} blob
 * @returns {Promise<string>} Data URL
 */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Estimate if image contains explicit content (simple heuristic)
 * @param {string} prompt
 * @returns {boolean}
 */
export function estimateExplicitContent(prompt) {
  const explicitKeywords = [
    'nude', 'naked', 'porn', 'sex', 'xxx', 'explicit', 'nsfw',
    'adult', 'erotic', 'sexual', 'mature', 'not safe for work',
    'undress', 'topless', 'bottomless', 'private parts',
  ];

  const lowerPrompt = prompt.toLowerCase();
  return explicitKeywords.some(keyword => lowerPrompt.includes(keyword));
}

/**
 * Detect if text contains image generation keywords
 * @param {string} text
 * @returns {object} { shouldGenerate: boolean, extractedPrompt: string }
 */
export function detectImageKeywords(text) {
  if (!text) return { shouldGenerate: false, extractedPrompt: '' };

  const lowerText = text.toLowerCase();
  
  // Image generation trigger keywords that appear at the start or as clear intent markers
  const triggerPatterns = [
    /^(?:generate|create|make|draw|paint|design|sketch|illustrate)\s+(?:an?\s+)?(?:image|picture|photo|artwork|art)\s+(?:of\s+)?(.+)$/i,
    /^(?:show|display|generate|create)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|artwork|art)\s+(?:of\s+)?(.+)$/i,
    /^(?:i\s+(?:want|need|would like|wish)\s+a(?:n)?\s+)?(?:image|picture|photo|artwork|art)\s+(?:of|showing|with|depicting)\s+(.+)$/i,
    /(?:^|\s)(?:generate|create|make|draw|show me)\s+(?:an?\s+)?(?:image|picture|photo)\s+of\s+(.+)$/i,
    /^(?:generate|create|make|draw|paint|design|imagine)\s+(.+)$/i, // Looser match: just "generate [description]"
  ];

  for (const pattern of triggerPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return {
        shouldGenerate: true,
        extractedPrompt: match[1].trim()
      };
    }
  }

  // Check for image-related queries in the message
  const imageKeywords = [
    'generate image', 'create image', 'make image', 'draw', 'paint', 'design',
    'show me image', 'picture of', 'photo of', 'artwork of', 'illustrate',
    'sketch of', 'visual of', 'render', 'imagine'
  ];

  // Only trigger if the keyword is in the first half of the message (indicates intent)
  const firstHalf = text.substring(0, text.length / 2).toLowerCase();
  
  for (const keyword of imageKeywords) {
    if (firstHalf.includes(keyword)) {
      // Extract everything after the keyword as the prompt
      const keywordIndex = lowerText.indexOf(keyword);
      const afterKeyword = text.substring(keywordIndex + keyword.length).trim();
      if (afterKeyword) {
        return {
          shouldGenerate: true,
          extractedPrompt: afterKeyword
        };
      }
    }
  }

  return { shouldGenerate: false, extractedPrompt: '' };
}

/**
 * Get download filename for generated image
 * @param {number} timestamp
 * @returns {string}
 */
export function getImageFilename(timestamp = Date.now()) {
  return `generated-image-${timestamp}.png`;
}
