const applyProviderAvailability = (providers, processDataButton, statusElement) => {
	const providerInputs = Array.from(document.querySelectorAll('input[name="provider"]'));
	const availableInputs = [];

	providerInputs.forEach((input) => {
		const isAvailable = Boolean(providers?.[input.id]);
		const container = input.closest('.field');

		if (container) {
			container.style.display = isAvailable ? '' : 'none';
		}

		input.disabled = !isAvailable;
		input.checked = false;

		if (isAvailable) {
			availableInputs.push(input);
		}
	});

	if (availableInputs.length > 0) {
		availableInputs[0].checked = true;
		processDataButton.disabled = false;
		return;
	}

	processDataButton.disabled = true;
	statusElement.textContent = "No model API keys found in .env.";
};

export const initializeProviderAvailability = async (processDataButton, statusElement) => {
	try {
		const response = await fetch('config/providers');
		if (!response.ok) {
			throw new Error(`Failed to load provider config: ${response.status}`);
		}

		const providers = await response.json();
		applyProviderAvailability(providers, processDataButton, statusElement);
	}
	catch (error) {
		console.error('Failed to initialize provider availability', error);
	}
};
