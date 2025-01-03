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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

// Create a web server
const app = express();
const port = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, "../public/")));
app.use(cors());

// Define a route to handle gpt query
app.post('/gpt', async (req, res) => {
	let body = "";
	req.on('data', data => {
		body += data;
	});

	// Create the Token.js client
	const tokenjs = new TokenJS({
		//baseURL: 'http://127.0.0.1:11434/v1/'
	});
	let provider = "gemini"; // options: openai, gemini, openai-compatible
	let model = "";

	if (provider == "openai") {
		model = "gpt-4o";
	} else if (provider == "gemini") {
		model = "gemini-1.5-pro";
	} else if (provider == "bedrock") {
		model = "meta.llama3-8b-instruct-v1:0";
	} else if (provider == "openai-compatible") {
		model = "llama3.2-vision";
	}

	// Initialize OpenAI API
/* 	const client = new OpenAI({
		apiKey: process.env.OPEN_API_KEY
	}); */
/* 	const client = new OpenAI({
		apiKey: process.env.GEMINI_API_KEY,
		baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
	}); */
/* 	const client = new OpenAI({
		baseURL: 'http://localhost:11434/v1/',

		// required but ignored
		apiKey: 'ollama',
	}); */

	req.on('end', async () => {
		body = JSON.parse(body);

		let language = req.query.language;

		let comment = body["comment"];
		let image = body["image"];

		let messagesArray = generateMessage(language, image, comment);

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
			//return res.status(200).send(answer);
			return res.status(200).send(JSON.stringify(answer));
		}
		main();
	});
});

// Define a route to handle gpt query
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

const convertImage = (imgPath) => {
	// read image file
	let data = fs.readFileSync(imgPath);

	// convert image file to base64-encoded string
	const base64Image = Buffer.from(data, 'binary').toString('base64');

	// combine all strings
	const base64ImageStr = `data:image/png;base64,${base64Image}`;
	return base64ImageStr;
};

const convertSBGNML = (sbgnmlPath) => {
	// read sbgnml file
	let data = fs.readFileSync(sbgnmlPath, 'utf8');

	return data;
};

const generateMessage = function(language, image, comment) {
	if (language == "PD") {
		let stylesheetImage = convertImage(path.join(__dirname, "assets/sbgn_pd_stylesheet.png"));
		let firstSampleImage = convertImage(path.join(__dirname, "assets/PD_reference1.png"));
		let secondSampleImage = convertImage(path.join(__dirname, "assets/PD_reference2.png"));
		let thirdSampleImage = convertImage(path.join(__dirname, "assets/PD_reference3.png"));
		//let forthSampleImage = convertImage(path.join(__dirname, "assets/PD_reference4.png"));

		let firstSampleSBGNML = convertSBGNML(path.join(__dirname, "assets/PD_reference1.sbgn"));
		let secondSampleSBGNML = convertSBGNML(path.join(__dirname, "assets/PD_reference2.sbgn"));
		let thirdSampleSBGNML = convertSBGNML(path.join(__dirname, "assets/PD_reference3.sbgn"));
		//let forthSampleSBGNML = convertSBGNML(path.join(__dirname, "assets/PD_reference4.sbgn"));

		console.log("here is pd");
		let userPrompt = "Now please generate the SBGNML for this hand-drawn SBGN PD diagram. Please note that macromolecule, simple cehmical, complex, nucleic acid feature, perturbing agent, unspecified entity, compartment, submap, empty set, phenotype, process, omitted process, uncertain process, association, dissociation, and, or, not nodes are represented with 'glyph' tag in SBGNML and consumption, production, modulation, simulation, catalysis, inhibition, necessary stimulation and logic arc edges are represented with 'arc' tag in SBGNML. Make sure that each element in the graph has the correct tag, this is very inportant. Please also make sure that each glyph has a label and bbox subtags and each arc has source and target defined as attribute inside arc tag (not as subtags). Take your time and act with careful consideration. DO NOT enclose the JSON output in markdown code blocks like ```json and ```, make sure that you are returning a valid JSON (this is important).";
		let userPromptWithComment = userPrompt;
		if(comment) {
			userPromptWithComment = userPrompt + " Additionally, please also consider the following comment during your process: " + comment;
		}
	
		let messagesArray = [
			{ role: 'system', content: 'You are a helpful and professional assistant for converting hand drawn biological networks drawn in Systems Biology Graphical Notation (SBGN) Process Description (PD) language and producing the corresponding SBGNML files. You will be first given an image of a stylesheet that is used to draw biological networks in SBGN PD. Then for an input hand-drawn biological network, you will analyze it and generate the corresponding SBGNML content. Please provide your final answer in JSON format. Do not return any answer outside of this format. A template looks like this: {"answer": "SBGNML content as a STRING so that we can parse it (This is very important)"}. DO NOT enclose the JSON output in markdown code blocks like ```json and ```, and make sure that you are returning a valid JSON (this is important).'
			},
			{ 
				role: "user", 
				content: [
					{type: 'text', text: "Here is a stylesheet (learner's card) of SBGN PD shapes (nodes and edges) and their corresponding classes written in the right columns."}, 
					{type: 'image_url', image_url: {
            "url": stylesheetImage
          }}
				]
			},
/* 			{ 
				role: "user", 
				content: [
					{type: 'text', text: promptsPD.firstSampleComment}, 
					{type: 'image_url', image_url: {
            "url": firstSampleImage
          }}
				]
			},
			{ 
				role: "assistant", 
				content: JSON.stringify({ answer: firstSampleSBGNML })
			}, */
			{ 
				role: "user", 
				content: [
					{type: 'text', text: promptsPD.secondSampleComment}, 
					{type: 'image_url', image_url: {
            "url": secondSampleImage 
          }}
				]
			},
			{ 
				role: "assistant", 
				content: JSON.stringify({ answer: secondSampleSBGNML })
			},
			{ 
				role: "user", 
				content: [
					{type: 'text', text: promptsPD.thirdSampleComment}, 
					{type: 'image_url', image_url: {
            "url": thirdSampleImage 
          }}
				]
			},
			{ 
				role: "assistant", 
				content: JSON.stringify({ answer: thirdSampleSBGNML })
			},
/* 			{ 
				role: "user", 
				content: [
					{type: 'text', text: promptsPD.forthSampleComment}, 
					{type: 'image_url', image_url: {
            "url": forthSampleImage 
          }}
				]
			},
			{ 
				role: "assistant", 
				content: '{"answer": ' + forthSampleSBGNML + '}'
			}, */
			{ 
				role: "user", 
				content: [
					{type: 'text', text: userPromptWithComment}, 
					{type: 'image_url', image_url: {
            "url": image
          }}
				]
			}
		];
		return messagesArray;
	}
	else if (language == "AF") {
		let stylesheetImage = convertImage(path.join(__dirname, "assets/sbgn_af_stylesheet.png"));
		let firstSampleImage = convertImage(path.join(__dirname, "assets/AF_reference1.png"));
		let secondSampleImage = convertImage(path.join(__dirname, "assets/AF_reference2.png"));

		let firstSampleSBGNML = convertSBGNML(path.join(__dirname, "assets/AF_reference1.sbgn"));
		let secondSampleSBGNML = convertSBGNML(path.join(__dirname, "assets/AF_reference2.sbgn"));
		console.log("here is af");
		let userPrompt = "Please generate the SBGNML for this hand-drawn SBGN AF diagram. Please note that biological activity, phenotype, and, or, not, delay nodes are represented with 'glyph' tag in SBGNML AF and positive influence, negative influence, unknown influence, necessary simulation and logic arc edges are represented with 'arc' tag in SBGNML AF. Make sure that each element in the graph has the correct tag, this is very inportant. Please also make sure that each glyph has a label and bbox subtags and each arc has source and target defined as attribute inside arc tag (not as subtags). Take your time and act with careful consideration. DO NOT enclose the JSON output in markdown code blocks like ```json and ```, make sure that you are returning a valid JSON (this is important).";
		let userPromptWithComment = userPrompt;
		if(comment) {
			userPromptWithComment = userPrompt + " Additionally, please also consider the following comment during your process: " + comment;
		}
	
		let messagesArray = [
			{ role: 'system', content: 'You are a helpful and professional assistant for converting hand drawn biological networks drawn in Systems Biology Graphical Notation (SBGN) Activity Flow (AF) language and producing the corresponding SBGNML files. You will be first given an image of a stylesheet that is used to draw biological networks in SBGN AF. Then for an input hand drawn biological network, you will analyze it and generate the corresponding SBGNML content. Please provide your final answer in JSON format. Do not return any answer outside of this format. A template looks like this: {"answer": "SBGNML content as a STRING so that we can parse it (This is very important)"}. Do NOT enclose the JSON output in markdown code blocks like ```json and make sure that you are returning a valid JSON (this is important).'
			},
			{ 
				role: "user", 
				content: [
					{type: 'text', text: "Here is a stylesheet of SBGN AF shapes (nodes and edges) and their corresponding classes written in the right columns. Try to learn this stylesheet thoroughly, because subsequent hand-drawn images will be drawn using the node and edge shapes in this stylesheet. Therefore, it is important to learn it correctly in order to classify nodes and edges in hand-drawn images correctly. For edges, pay particular attention to arrows because arrows differentiate the edge class. Input edges to AND, OR and NOT nodes can only be logic arcs."}, 
					{type: 'image_url', image_url: {
            "url": stylesheetImage
          }}
				]
			},
			{ 
				role: "user", 
				content: [
					{type: 'text', text: promptsAF.firstSampleComment}, 
					{type: 'image_url', image_url: {
            "url": firstSampleImage
          }}
				]
			},
			{ 
				role: "assistant", 
				content: JSON.stringify({ answer: firstSampleSBGNML })
			},
 			{ 
				role: "user", 
				content: [
					{type: 'text', text: promptsAF.secondSampleComment}, 
					{type: 'image_url', image_url: {
            "url": secondSampleImage 
          }}
				]
			},
			{ 
				role: "assistant", 
				content: JSON.stringify({ answer: secondSampleSBGNML })
			},
			{ 
				role: "user", 
				content: [
					{type: 'text', text: userPromptWithComment}, 
					{type: 'image_url', image_url: {
            "url": image
          }}
				]
			}
		];
		return messagesArray;
	}
};

export { port, app }