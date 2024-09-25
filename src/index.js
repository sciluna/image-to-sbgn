import express from 'express';
import { config } from 'dotenv';
import { OpenAI } from 'openai';
import fs from 'fs';
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
	apiKey: process.env.OPEN_API_KEY
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
	
		let stylesheetImage = convert(path.join(__dirname, "images/sbgn_stylesheet.png"));
	
		let messagesArray = [
			{ role: 'system', content: 'You are a helpful and professional assistant for converting hand drawn biological networks drawn in Systems Biology Graphical Notation (SBGN) and producing the corresponding SBGNML files. You will be first given an image of a stylesheet that is used to draw biological networks in SBGN. Then for an input hand drawn biological network, you will analyze it and generate the corresponding SBGNML content. Please provide your final answer in JSON format. Do not return any answer outside of this format. A template looks like this: {"answer": "SBGNML content as a string"}. Do not enclose the JSON output in markdown code blocks and make sure that you are returning a valid JSON.'
			},
			{ 
				"role": "user", 
				"content": [
					{type: 'text', text: "Here is a stylesheet of SBGN shapes (nodes and edges) and their corresponding classes written in the right columns."}, 
					{type: 'image_url', image_url: {
            "url": stylesheetImage
          }}
				]
			},
			{ 
				"role": "user", 
				"content": [
					{type: 'text', text: "Now, based on what you’ve learned, generate the SBGNML for this hand-drawn SBGN diagram. Please note that macromolecule, simple cehmical, complex, nucleic acid feature, perturbing agent, unspecified entity, compartment, submap, empty set, phenotype, process, omitted process, uncertain process, association, dissociation, and, or, not are represented with 'glyph' tag in SBGNML and consumption, production, modulation, simulation, catalysis, inhibition, necessary stimulation are represented with 'arc' tag in SBGNML. Make sure that each element in the graph has the currect tag. Please also make sure that each glyph has a label and bbox subtags and each arc has source and target defined as attribute inside arc tag (not as subtags)."}, 
					{type: 'image_url', image_url: {
            "url": image
          }}
				]
			}
		];

		async function main() {
			const response = await openai.chat.completions.create({
				model: 'gpt-4o',
				messages: messagesArray
			});
			let answer = response.choices[0]["message"]["content"];
			console.log(answer);
			//return res.status(200).send(answer);
			return res.status(200).send(JSON.stringify(answer));
		}
		main();
	});
});

const convert = (imgPath) => {
	// read image file
	let data = fs.readFileSync(imgPath);

	// convert image file to base64-encoded string
	const base64Image = Buffer.from(data, 'binary').toString('base64');
	//console.log(base64Image);

	// combine all strings
	const base64ImageStr = `data:image/png;base64,${base64Image}`;
	return base64ImageStr;
}

export { port, app }