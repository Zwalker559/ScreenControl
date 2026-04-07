// Comprehensive profanity and explicit content word lists
const PROFANITY_LIST = [
  'damn', 'hell', 'crap', 'ass', 'shit', 'fuck', 'bitch', 'bastard',
  'dickhead', 'asshole', 'prick', 'twat', 'wanker', 'bugger', 'bollocks',
  'arse', 'cock', 'pussy', 'tit', 'boob', 'breast', 'nipple',
];

const EXPLICIT_KEYWORDS = [
  'xxx', 'porn', 'sex', 'nude', 'naked', 'explicit', 'nsfw', 'adult only',
  'xxx rated', 'x rated', 'adult content', 'sexual content', 'erotic',
];

const FILTER_REPLACEMENTS = {
  'fuck': '****',
  'shit': '****',
  'damn': 'd***',
  'hell': 'h***',
  'bitch': 'b****',
  'bastard': 'b*****',
  'crap': 'c***',
  'ass': 'a**',
  'dick': 'd***',
  'cock': 'c***',
  'pussy': 'p****',
  'porn': 'p***',
  'nude': 'n***',
  'naked': 'n****',
  'sexy': 's***',
};

/**
 * Check if text contains profanity
 * @param {string} text
 * @returns {boolean}
 */
export function containsProfanity(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => lowerText.includes(word));
}

/**
 * Check if text contains explicit content keywords
 * @param {string} text
 * @returns {boolean}
 */
export function containsExplicitKeywords(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return EXPLICIT_KEYWORDS.some(word => lowerText.includes(word));
}

/**
 * Filter text by replacing profanity
 * @param {string} text
 * @returns {string}
 */
export function filterProfanity(text) {
  if (!text) return text;
  let filtered = text;
  
  Object.entries(FILTER_REPLACEMENTS).forEach(([word, replacement]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, replacement);
  });
  
  return filtered;
}

/**
 * Check if image generation prompt is appropriate (filters explicit requests)
 * @param {string} prompt
 * @returns {object} { isAppropriate: boolean, reason: string }
 */
export function validateImagePrompt(prompt) {
  if (!prompt) return { isAppropriate: true, reason: '' };
  
  const lowerPrompt = prompt.toLowerCase();
  
  const explicitIndicators = [
    'nude', 'naked', 'porn', 'sex', 'xxx', 'explicit', 'nsfw',
    'adult only', 'not safe for work', 'mature content',
  ];
  
  for (const indicator of explicitIndicators) {
    if (lowerPrompt.includes(indicator)) {
      return {
        isAppropriate: false,
        reason: `Image generation cannot create explicit content containing "${indicator}"`
      };
    }
  }
  
  return { isAppropriate: true, reason: '' };
}

/**
 * Sanitize response based on filter settings
 * @param {string} content
 * @param {boolean} isFiltered
 * @returns {string}
 */
export function sanitizeResponse(content, isFiltered) {
  if (!isFiltered || !content) return content;
  
  let sanitized = content;
  
  // Replace profanity
  if (containsProfanity(sanitized)) {
    sanitized = filterProfanity(sanitized);
  }
  
  return sanitized;
}

/**
 * Check if content should be displayed with warning (unfiltered mode)
 * @param {string} content
 * @returns {boolean}
 */
export function shouldWarnContent(content) {
  if (!content) return false;
  return containsProfanity(content) || containsExplicitKeywords(content);
}
