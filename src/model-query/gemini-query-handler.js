import { OpenAI } from 'openai';
import { cleanAnswer, logTokenUsage } from './shared.js';

const getGeminiClient = () => new OpenAI({
	apiKey: process.env.GEMINI_API_KEY,
	baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

const normalizeGeminiMessageContent = (content) => {
	if (typeof content === 'string') {
		return content;
	}

	if (!Array.isArray(content)) {
		return content;
	}

	return content.map((part) => {
		if (part.type === 'input_text') {
			return { type: 'text', text: part.text };
		}

		if (part.type === 'input_image') {
			return {
				type: 'image_url',
				image_url: {
					url: part.image_url
				}
			};
		}

		return part;
	});
};

const normalizeMessagesForGemini = (messagesArray) => {
	return messagesArray.map((message) => ({
		role: message.role,
		content: normalizeGeminiMessageContent(message.content)
	}));
};

const extractGeminiMessageText = (content) => {
	if (typeof content === 'string') {
		return content;
	}

	if (!Array.isArray(content)) {
		return '';
	}

	return content
		.map((part) => {
			if (typeof part === 'string') {
				return part;
			}
			if (part?.type === 'text') {
				return part.text ?? '';
			}
			return '';
		})
		.join('');
};

export class GeminiQueryHandler {
	supports(model) {
		return model?.startsWith('gemini-');
	}

	async execute({ model, messagesArray }) {
		if (!process.env.GEMINI_API_KEY) {
			throw new Error('GEMINI_API_KEY is not set.');
		}

		const geminiClient = getGeminiClient();
		const response = await geminiClient.chat.completions.create({
			model: model,
			messages: normalizeMessagesForGemini(messagesArray),
			temperature: 0,
			reasoning_effort: 'none'
		});

		logTokenUsage(response.usage);
		return cleanAnswer(extractGeminiMessageText(response.choices?.[0]?.message?.content));
	}
}
