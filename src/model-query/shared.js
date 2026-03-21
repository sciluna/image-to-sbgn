export const cleanAnswer = (answer) => {
	return answer
		.replaceAll('```json', '')
		.replaceAll('```', '');
};

export const readErrorBody = async (response) => {
	const contentType = response.headers.get('content-type') ?? '';

	if (contentType.includes('application/json')) {
		try {
			return await response.json();
		}
		catch {
			return null;
		}
	}

	try {
		return await response.text();
	}
	catch {
		return null;
	}
};

const formatTokens = (value) => {
	if (value == null || Number.isNaN(value)) {
		return '0';
	}
	if (value >= 10000) {
		return `${(value / 1000).toFixed(1).replace(/\\.0$/, '')}K`;
	}
	if (value >= 1000) {
		return `${(value / 1000).toFixed(2).replace(/0+$/, '').replace(/\\.$/, '')}K`;
	}
	return `${value}`;
};

export const logTokenUsage = (usage) => {
	if (!usage) {
		return;
	}

	const promptTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0;
	const completionTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;
	const totalTokens = usage.total_tokens ?? (promptTokens + completionTokens);

	const total = formatTokens(totalTokens);
	const prompt = formatTokens(promptTokens);
	const completion = formatTokens(completionTokens);
	console.log(`Tokens: ${total} total (${prompt} input + ${completion} output)`);
};
