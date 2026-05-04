import Groq from 'groq-sdk/index.mjs';

// Initialize Groq client with API key from environment
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for browser-based requests
});

// Export functions to interact with Groq API
export const groqClient = {
  async completionCreate(options) {
    try {
      const response = await groq.chat.completions.create({
        messages: options.messages || [{ role: 'user', content: options.prompt }],
        model: import.meta.env.VITE_GROQ_MODEL || 'mixtral-8x7b-32768',
        max_tokens: options.max_tokens || 1024,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 1.0,
      });

      return response.choices[0]?.message?.content || 'No response';
    } catch (error) {
      console.error('Groq API Error:', error);
      throw new Error(error.message || 'Failed to get response from Groq');
    }
  }
};
