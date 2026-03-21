export const getProviderAvailability = () => ({
	openai: Boolean(process.env.OPENAI_API_KEY),
	gemini: Boolean(process.env.GEMINI_API_KEY),
	claude: Boolean(process.env.ANTHROPIC_API_KEY),
	'claude-opus': Boolean(process.env.ANTHROPIC_API_KEY)
});
