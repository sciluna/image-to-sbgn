import express from 'express';
import { config } from 'dotenv';
import { TokenJS } from 'token.js'
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promptsPD, promptsAF } from './prompts.js';
import { convertSBGNML, generateMessageForImageInput, generateMessageForTextInput, generateMessageForEdit } from './sbgn.js';
import { addAnnotations } from './annotation.js';
import format from "xml-formatter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tempDir = './src/public/temp';

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Load environment variables
config();

// Create a web server
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "../public/")));

const tempFilesPath = path.join(__dirname, 'public'); // this is src/public
app.use('/temp', express.static(path.join(tempFilesPath, 'temp')));

app.use(cors());

const client = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

// Define a route to handle generation from image
app.post('/sbgnml/from-image', async (req, res) => {
	let body = "";
	req.on('data', data => {
		body += data;
	});

	req.on('end', async () => {
		body = JSON.parse(body);
		let image = body["image"];
		let language = body["language"];
		//let provider = body["provider"];
		let model = body["model"];
		let context = body["context"];
		let annotate = body["annotate"] || false;

/* 		// Create the Token.js client
		const tokenjs = new TokenJS({
			//baseURL: 'http://127.0.0.1:11434/v1/'
		});

		let model = "";

		if (provider == "openai") {
			model = "gpt-4.1";
		} else if (provider == "gemini") {
			model = "gemini-2.0-flash-001";
		} */

		let messagesArray = generateMessageForImageInput(language, image, context);

		let response = await makeQuery(client, model, messagesArray);
		if(annotate) {	// add annotations
			response = await addAnnotations(JSON.parse(response).answer);
		} else {
			response = JSON.parse(response).answer;
		}
		response = format(response, {indentation: '  '});
		return res.status(200).json({answer: response});
	});
});

// Define a route to handle generation from text
app.post('/sbgnml/from-text', async (req, res) => {
	let body = "";
	req.on('data', data => {
		body += data;
	});

	req.on('end', async () => {
		body = JSON.parse(body);
		let text = body["text"];
		let language = body["language"];
		let model = body["model"];

		let messagesArray = generateMessageForTextInput(language, text);

		let answer = await makeQuery(client, model, messagesArray);
		return res.status(200).json(answer);
	});
});

// Define a route to handle editing of SBGNML
app.post('/sbgnml/edit', async (req, res) => {
	let body = "";
	req.on('data', data => {
		body += data;
	});

	req.on('end', async () => {
		body = JSON.parse(body);
		let sbgnml = body["sbgnml"];
		let language = body["language"];
		let model = body["model"];
		let instructions = body["instructions"];

		const client = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY
		});

		let messagesArray = generateMessageForEdit(language, sbgnml, instructions);

		let answer = await makeQuery(client, model, messagesArray);
		return res.status(200).json(answer);
	});
});

// Define a route to handle annotation query
app.post('/anno', async (req, res) => {
	let body = "";
	req.on('data', async (data) => {
		body += data;
	});
	req.on('end', async () => {
		let url = "http://grounding.indra.bio/ground_multi";
		const settings = {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: body
		};

		let result = await fetch(url, settings)
			.then(response => response.json())
			.then(result => {
				return result;
			})
			.catch(e => {
				console.log("Error!");
			});
		return res.status(200).send(JSON.stringify(result, null, 2));
	});
});


let makeQuery = async function(client, model, messagesArray) {
	const response = await client.responses.create({
		model: model,
		input: messagesArray,
		temperature: 0,
		reasoning: {
			effort: "none"
		}
	});
	logTokenUsage(response.usage);
	let answer = response.output_text;
	//console.log(answer);
	answer = answer.replaceAll('```json', '');
	answer = answer.replaceAll('```', '');
	return answer;
};

const uploadDir = path.join(__dirname, 'public', 'temp');

// Define a route to handle uploaded file query
app.post('/upload', async (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) return res.status(400).json({ error: 'Missing filename or content' });

  const filePath = path.join(uploadDir, filename);

  fs.writeFile(filePath, content, 'utf8', (err) => {
    if (err) return res.status(500).json({ error: 'Failed to save file' });

    const basePath = process.env.NODE_ENV === 'production' ? '/image2sbgn' : '';
    const fileUrl = `https://${req.get('host')}${basePath}/temp/${filename}`;

    res.status(200).json({ url: fileUrl, filename });
  });
});

// Define a route to delete uploaded file query
app.post('/delete', async (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: 'Missing filename' });
  }

  const filePath = path.join(uploadDir, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('File delete error:', err);
      return res.status(500).json({ error: 'Failed to delete file' });
    }

    // Optional: construct the public URL if needed
    const basePath = process.env.NODE_ENV === "production" ? "/image2sbgn" : "";
    const fileUrl = `https://${req.get('host')}${basePath}/temp/${filename}`;

    res.status(200).json({ message: 'File deleted successfully', url: fileUrl });
  });
});

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

// Define a route to handle annotation query
app.post('/pd2af', async (req, res) => {
	let body = "";
	req.on('data', async (data) => {
		body += data;
	});

	req.on('end', async () => {
		body = JSON.parse(body);
		let pd_sbgnml = body["pd_sbgnml"];
		let provider = body["model"];

		// Create the Token.js client
		const tokenjs = new TokenJS({
			//baseURL: 'http://127.0.0.1:11434/v1/'
		});

		let model = "";

		if (provider == "openai") {
			model = "gpt-4.1";
		} else if (provider == "gemini") {
			model = "gemini-2.0-flash-001";
		} else if (provider == "bedrock") {
			model = "meta.llama3-8b-instruct-v1:0";
		} else if (provider == "openai-compatible") {
			model = "llama3.2-vision";
		}

		let messagesArray = generateMessageForPD2AF(pd_sbgnml);
		console.log(messagesArray[1].content);

		async function main() {
			const response = await tokenjs.chat.completions.create({
				provider: provider,
				model: model,
				messages: messagesArray
			});
			let answer = response.choices[0]["message"]["content"];
			console.log(answer);
			answer = answer.replaceAll('```json', '');
			answer = answer.replaceAll('```', '');
			return res.status(200).send(JSON.stringify(answer));
		}
		main();
	});
});

// for fine tuning

const sbgnmlLinks = [
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/samplePD1_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/samplePD2_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/samplePD3_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/samplePD4_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/samplePD5_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/samplePD6_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/samplePD7_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/samplePD8_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/samplePD9_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/samplePD10_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/sampleAF1_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/sampleAF2_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/sampleAF3_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/sampleAF4_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/sampleAF5_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/sampleAF6_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/sampleAF7_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/sampleAF8_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/sampleAF9_ft_hd.png?raw=true",
	"https://github.com/sciluna/image-to-sbgn-analysis/blob/main/dataset/fine-tuning/sampleAF10_ft_hd.png?raw=true",
];

const generateMessagesForFT = function () {
	let finalContent = [];
	
	for (let i = 0; i < 20; i++) {
		let language = i < 10 ? "PD" : "AF";
		let sbgnmlContent = convertSBGNML(path.join(__dirname, "ft_sbgnmls/sample" + language + (i%10 + 1) + "_ft.sbgnml"));

		finalContent.push(JSON.stringify(generateMessagesLineForFT(language, sbgnmlLinks[i], sbgnmlContent)));
	}

	finalContent = finalContent.join("\n"); 

	const filePath = "output.jsonl";

	fs.writeFile(filePath, finalContent, (err) => {
		if (err) {
			console.error("Error writing to file:", err);
		} else {
			console.log(`JSONL content successfully written to ${filePath}`);
		}
	});
};

const generateMessagesLineForFT = function (language, imageLink, sbgnmlContent) {
	let jsonContent = { "messages" : [] };

	let systemMessage = {};
	systemMessage["role"] = "system";
	systemMessage["content"] = "You are a helpful and professional assistant for converting hand drawn biological networks drawn in Systems Biology Graphical Notation (SBGN) Process Description (PD) or Activity Flow (AF) language and producing the corresponding SBGNML files. You will be given an input hand-drawn biological network, you will analyze it and generate the corresponding SBGNML content. Please provide your final answer in JSON format. Do not return any answer outside of this format. A template looks like this: {\"answer\": SBGNML content as a STRING so that we can parse it (This is very important)}. DO NOT enclose the JSON output in markdown code blocks like ```json and ```, and make sure that you are returning a valid JSON (this is important).";

	jsonContent["messages"].push(systemMessage);

	let userMessage1 = {};
	userMessage1["role"] = "user";
	userMessage1["content"] = "Please generate the SBGNML for this hand-drawn SBGN " + language + " diagram. Make sure that each element in the graph has the correct tag, this is very inportant. Please also make sure that each glyph has a label and bbox subtags and each arc has source and target defined as attribute inside arc tag (not as subtags). Take your time and act with careful consideration. DO NOT enclose the JSON output in markdown code blocks like ```json and ```, make sure that you are returning a valid JSON (this is important).";
	jsonContent["messages"].push(userMessage1);

	let userMessage2 = {};
	userMessage2["role"] = "user";
	userMessage2["content"] = imageLink;
	jsonContent["messages"].push(userMessage2);

	let assistantMessage = {};
	assistantMessage["role"] = "assistant";
	assistantMessage["content"] = JSON.stringify({ answer: sbgnmlContent });
	jsonContent["messages"].push(assistantMessage);
	
	return jsonContent;
};

export { port, app }
