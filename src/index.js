import express from 'express';
import { config } from 'dotenv';
import { OpenAI } from 'openai';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

// Create a web server
const app = express();
const port = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, "../public/")));
app.use(cors());

// Initialize OpenAI API
const openai = new OpenAI({
	apiKey: process.env.OPEN_API_KEY,
	/* 	baseURL: 'http://localhost:11434/v1',
		apiKey: 'ollama', */
});

// Define a route to handle questions
app.post('/', async (req, res) => {
	let body = "";
	req.on('data', data => {
		body += data;
	});

	req.on('end', async () => {
		body = JSON.parse(body);

		let question = body["question"];
		let image = body["image"];

		async function main() {
			const response = await openai.chat.completions.create({
				model: 'gpt-4o',
				messages: [
					{ role: 'system', content: 'You are a helpful and professional assistant for converting hand drawn biological networks into Systems Biology Graphical Notation (SBGN) and producing the corresponding SBGNML files. You will be shown a single image of a biological network with detailed instructions. Please provide your final answer in JSON format. Do not return any answer outside of this format. A template looks like this: {"thoughts": "Structure your thoughts in a professional way, like an expert bioinformation would do", "answer": "SBGNML content as a string" }. Do not enclose the JSON output in markdown code blocks.' },
					{
						role: 'user',
						content: [
							{ type: 'text', text: question },
							{
								type: 'image_url',
								image_url: {
									url: image
								}
							},
						],
					},
				]
			});
			let answer = response.choices[0]["message"]["content"];
			console.log(answer);
			//return res.status(200).send(answer);
			return res.status(200).send(JSON.stringify(answer));
		}
		main();
	});
});

export { port, app }