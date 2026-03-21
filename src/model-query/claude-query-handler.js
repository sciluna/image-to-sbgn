import { detectImageMediaType, splitDataUrl } from '../utils/image-utils.js';
import { cleanAnswer, logTokenUsage, readErrorBody } from './shared.js';

const normalizeClaudeMessageContent = (content) => {
	if (typeof content === 'string') {
		return [{ type: 'text', text: content }];
	}

	if (!Array.isArray(content)) {
		return [];
	}

	return content.flatMap((part) => {
		if (part.type === 'input_text') {
			return [{ type: 'text', text: part.text }];
		}

		if (part.type === 'input_image') {
			const { mediaType, data } = splitDataUrl(part.image_url);
			return [{
				type: 'image',
				source: {
					type: 'base64',
					media_type: detectImageMediaType(data, mediaType),
					data: data
				}
			}];
		}

		if (part.type === 'text') {
			return [{ type: 'text', text: part.text ?? '' }];
		}

		return [];
	});
};

const normalizeMessagesForClaude = (messagesArray) => {
	const system = messagesArray
		.filter((message) => message.role === 'system')
		.map((message) => typeof message.content === 'string' ? message.content : '')
		.filter(Boolean)
		.join('\n\n');

	const messages = messagesArray
		.filter((message) => message.role !== 'system')
		.map((message) => ({
			role: message.role,
			content: typeof message.content === 'string'
				? message.content
				: normalizeClaudeMessageContent(message.content)
		}));

	return { system, messages };
};

const extractClaudeMessageText = (content) => {
	if (!Array.isArray(content)) {
		return '';
	}

	return content
		.map((part) => part?.type === 'text' ? part.text ?? '' : '')
		.join('');
};

export class ClaudeQueryHandler {
	supports(model) {
		return model?.startsWith('claude-');
	}

	async execute({ model, messagesArray }) {
		if (!process.env.ANTHROPIC_API_KEY) {
			throw new Error('ANTHROPIC_API_KEY is not set.');
		}

		const { system, messages } = normalizeMessagesForClaude(messagesArray);
		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-api-key': process.env.ANTHROPIC_API_KEY,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: model,
				max_tokens: 8192,
				system: system,
				messages: messages
			})
		});

		if (!response.ok) {
			const errorBody = await readErrorBody(response);
			const requestId = response.headers.get('request-id');
			const errorMessage = typeof errorBody === 'string'
				? errorBody
				: errorBody?.error?.message ?? JSON.stringify(errorBody);
			throw new Error(`Anthropic API request failed with status ${response.status}: ${errorMessage}${requestId ? ` (request-id: ${requestId})` : ''}`);
		}

		const result = await response.json();
		logTokenUsage(result.usage);
		return cleanAnswer(extractClaudeMessageText(result.content));
	}
}
