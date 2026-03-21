import { ClaudeQueryHandler } from './model-query/claude-query-handler.js';
import { GeminiQueryHandler } from './model-query/gemini-query-handler.js';
import { OpenAIQueryHandler } from './model-query/openai-query-handler.js';

const queryHandlers = [
	new GeminiQueryHandler(),
	new ClaudeQueryHandler(),
	new OpenAIQueryHandler()
];

export const makeQuery = async (client, model, messagesArray) => {
	const handler = queryHandlers.find((item) => item.supports(model));
	return handler.execute({ client, model, messagesArray });
};
