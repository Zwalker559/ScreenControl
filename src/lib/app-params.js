const getGroqConfig = () => {
	return {
		apiKey: import.meta.env.VITE_GROQ_API_KEY,
		model: import.meta.env.VITE_GROQ_MODEL || 'mixtral-8x7b-32768',
	};
};

export const appParams = {
	...getGroqConfig()
};
