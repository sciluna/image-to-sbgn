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
import { convertSBGNML, generateMessage } from './sbgn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tempDir = './src/public/temp';

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

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

// Define a route to handle llm query
app.post('/gpt', async (req, res) => {
	let body = "";
	req.on('data', data => {
		body += data;
	});

	req.on('end', async () => {
		body = JSON.parse(body);
		let comment = body["comment"];
		let image = body["image"];
		let language = body["language"];
		//let provider = body["provider"];
		let model = body["model"];

		// Create the Token.js client
/* 		const tokenjs = new TokenJS({
			//baseURL: 'http://127.0.0.1:11434/v1/'
		}); */

/* 		let model = "";

		if (provider == "openai") {
			model = "gpt-4.1";
		} else if (provider == "gemini") {
			model = "gemini-2.0-flash-001";
		} */

/* 		let messagesArray0 = generateMessage0(language, image, comment);
		async function main0() {
			const response = await tokenjs.chat.completions.create({
				provider: provider,
				model: model,
				messages: messagesArray0
			});
			let answer = response.choices[0]["message"]["content"];
			console.log(answer);
			answer = answer.replaceAll('```json', '');
			answer = answer.replaceAll('```', '');
			return res.status(200).send(JSON.stringify(answer));
		}
		let nodeData = await main0(); */

		const client = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY
		});

		let messagesArray = generateMessage(language, image, comment);
		//generateMessagesForFT();
		async function main() {
			const response = await client.chat.completions.create({
				model: model,
				messages: messagesArray,
				temperature: 0
			});
			logTokenUsage(response.usage);
			let answer = response.choices[0]["message"]["content"];
			console.log(answer);
			answer = answer.replaceAll('```json', '');
			answer = answer.replaceAll('```', '');
			return res.status(200).send(JSON.stringify(answer));
		}
		main();
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

const generateMessage0 = function (language, image, comment) {
	if (language == "PD") {
		let messagesArray = [
			{
				role: 'system', content: 'You are a helpful and professional assistant to analyze hand drawn biological networks drawn in Systems Biology Graphical Notation (SBGN) Process Description (PD) language. You will be given an input hand-drawn biological network in SBGN, you will analyze it and generate the corresponding node information. Please provide your final answer in JSON format. Do not return any answer outside of this format. DO NOT enclose the JSON output in markdown code blocks like ```json and ```, and make sure that you are returning a valid JSON (this is important).'
			},
			{
				role: "user",
				content: [
					{ type: 'text', text: "Please generate the node (glyph) information for this hand-drawn SBGN PD diagram. Please note that SBGN PD has the following node classes: macromolecule, simple cehmical, complex, nucleic acid feature, perturbing agent, unspecified entity, compartment, submap, empty set, phenotype, process, omitted process, uncertain process, association, dissociation, and, or, not. I want you to extract the node class from the label of the node. If a node doesn't have a label you can infer its class from its shape or position or connections. There can be more than one node with same label, please provide each separately. Take your time and act with careful consideration. I want you to provide your answer in JSON format. DO NOT enclose the JSON output in markdown code blocks like ```json and ```, make sure that you are returning a valid JSON (this is important)." },
					{
						type: 'image_url', image_url: { "url": image }
					}
				]
			}
		];
		return messagesArray;
	}
};




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
	console.l
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
