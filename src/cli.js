#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { OpenAI } from 'openai';
import { convertImageToBase64, generateMessage } from './sbgn.js';

const DEFAULT_LANGUAGE = 'PD';
const DEFAULT_MODEL = 'gpt-5.2';

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

const logTokenUsage = (usage) => {
  if (!usage) {
    return;
  }
  const total = formatTokens(usage.total_tokens);
  const prompt = formatTokens(usage.prompt_tokens);
  const completion = formatTokens(usage.completion_tokens);
  console.log(`Tokens: ${total} total (${prompt} input + ${completion} output)`);
};

const printHelp = () => {
  console.log(`Usage: image-to-sbgn --image <path-or-url> [options]

Options:
  -i, --image <path-or-url>  Input image file path or URL (required)
  -l, --language <PD|AF>     SBGN language (default: ${DEFAULT_LANGUAGE})
  -m, --model <model>        OpenAI model (default: ${DEFAULT_MODEL})
  -c, --comment <text>       Optional extra instructions for the model
  -o, --output <path>        Output file path (default: stdout)
  -h, --help                 Show this help message

Examples:
  image-to-sbgn --image ./diagram.png --language PD --output ./diagram.sbgn
  image-to-sbgn --image https://example.com/diagram.png --language AF
`);
};

const readArgValue = (args, index, flag) => {
  const value = args[index];
  if (!value || value.startsWith('-')) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
};

const normalizeLanguage = (value) => {
  const normalized = value.toUpperCase();
  if (normalized !== 'PD' && normalized !== 'AF') {
    throw new Error(`Unsupported language: ${value}`);
  }
  return normalized;
};

const parseArgs = (argv) => {
  const options = {
    language: DEFAULT_LANGUAGE,
    model: DEFAULT_MODEL,
    output: null,
    comment: null,
    image: null,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
      return options;
    }

    if (arg === '-i' || arg === '--image') {
      options.image = readArgValue(argv, i + 1, arg);
      i += 1;
      continue;
    }

    if (arg.startsWith('--image=')) {
      options.image = arg.split('=').slice(1).join('=');
      continue;
    }

    if (arg === '-l' || arg === '--language') {
      options.language = normalizeLanguage(readArgValue(argv, i + 1, arg));
      i += 1;
      continue;
    }

    if (arg.startsWith('--language=')) {
      options.language = normalizeLanguage(arg.split('=').slice(1).join('='));
      continue;
    }

    if (arg === '-m' || arg === '--model') {
      options.model = readArgValue(argv, i + 1, arg);
      i += 1;
      continue;
    }

    if (arg.startsWith('--model=')) {
      options.model = arg.split('=').slice(1).join('=');
      continue;
    }

    if (arg === '-c' || arg === '--comment') {
      options.comment = readArgValue(argv, i + 1, arg);
      i += 1;
      continue;
    }

    if (arg.startsWith('--comment=')) {
      options.comment = arg.split('=').slice(1).join('=');
      continue;
    }

    if (arg === '-o' || arg === '--output') {
      options.output = readArgValue(argv, i + 1, arg);
      i += 1;
      continue;
    }

    if (arg.startsWith('--output=')) {
      options.output = arg.split('=').slice(1).join('=');
      continue;
    }

    if (!arg.startsWith('-') && !options.image) {
      options.image = arg;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  options.language = normalizeLanguage(options.language);
  return options;
};

const isRemoteImage = (value) => {
  return /^https?:\/\//i.test(value) || value.startsWith('data:');
};

const resolveImageInput = (imageInput) => {
  if (isRemoteImage(imageInput)) {
    return imageInput;
  }

  const resolvedPath = path.resolve(imageInput);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Image file not found: ${resolvedPath}`);
  }

  return convertImageToBase64(resolvedPath);
};

const extractAnswer = (rawContent) => {
  const normalized = rawContent
    .replaceAll('```json', '')
    .replaceAll('```', '')
    .trim();

  try {
    const parsed = JSON.parse(normalized);
    if (parsed && typeof parsed.answer === 'string') {
      return parsed.answer;
    }
  } catch (error) {
    return normalized;
  }

  return normalized;
};

const writeOutput = (outputPath, content) => {
  if (!outputPath || outputPath === '-') {
    const suffix = content.endsWith('\n') ? '' : '\n';
    process.stdout.write(`${content}${suffix}`);
    return;
  }

  fs.writeFileSync(outputPath, content, 'utf8');
};

const main = async () => {
  config();

  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (!options.image) {
    printHelp();
    throw new Error('Missing required --image argument.');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set.');
  }

  const imageInput = resolveImageInput(options.image);
  const messages = generateMessage(options.language, imageInput, options.comment);

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: options.model,
    input: messages,
    temperature: 0,
    reasoning: {
      effort: "none"
    }
  });

  logTokenUsage(response.usage);
  const content = response.output_text || '';
  const answer = extractAnswer(content);
  writeOutput(options.output, answer);
};

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
