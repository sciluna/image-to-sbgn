import { cleanAnswer, logTokenUsage } from './shared.js';

export class OpenAIQueryHandler {
	supports(model) {
		return !model?.startsWith('gemini-') && !model?.startsWith('claude-');
	}

	async execute({ client, model, messagesArray }) {
		const response = await client.responses.create({
			model: model,
			input: messagesArray,
			temperature: 0,
			reasoning: {
				effort: "none"
			}
		});

		logTokenUsage(response.usage);
		return cleanAnswer(response.output_text);
	}
}
