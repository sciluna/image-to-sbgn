import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const assetsDir = path.join(__dirname, 'assets');

const convertImageToBase64 = (imgPath) => {
  const data = fs.readFileSync(imgPath);
  const base64Image = Buffer.from(data, 'binary').toString('base64');
  return `data:image/png;base64,${base64Image}`;
};

const convertSBGNML = (sbgnmlPath) => {
  return fs.readFileSync(sbgnmlPath, 'utf8');
};

const generateMessage = (language, image, comment) => {
  if (language === 'PD') {
    const stylesheetImage = convertImageToBase64(
      path.join(assetsDir, 'sbgn_pd_stylesheet.png')
    );
    const sampleImage = convertImageToBase64(path.join(assetsDir, 'PD_reference.png'));
    const sampleSBGNML = convertSBGNML(path.join(assetsDir, 'PD_reference.sbgn'));

    let userPrompt = 'Please generate the SBGNML for this hand-drawn SBGN-PD diagram. Please note that macromolecule, simple chemical, complex, nucleic acid feature, perturbing agent, unspecified entity, compartment, empty set, tag, phenotype, process, omitted process, uncertain process, association, dissociation, and, or, not nodes are represented with "glyph" tag in SBGNML PD and consumption, production, modulation, stimulation, catalysis, inhibition, necessary stimulation, logic arc and equivalence arc are represented with "arc" tag in SBGNML PD. Make sure that each element in the graph has the correct tag, this is very inportant. Please also make sure that each glyph has a label and bbox subtags and each arc has source and target defined as attribute inside arc tag (not as subtags). Take your time and act with careful consideration. Please provide your final answer in JSON format. Do not return any answer outside of this format. A template looks like this: {"answer": "SBGNML content as a STRING so that we can parse it (This is very important)"}. DO NOT enclose the JSON output in markdown code blocks like ```json and ```, make sure that you are returning a valid JSON (this is important).';
    let userPromptWithComment = userPrompt;
    if (comment) {
      userPromptWithComment = `${userPrompt} Additionally, please also consider the following comment during your process: ${comment}`;
    }

    return [
      {
        role: 'system',
        content: 'You are a helpful and professional assistant for converting hand-drawn biological networks drawn in Systems Biology Graphical Notation (SBGN) Process Description (PD) language and producing the corresponding SBGNML files. For an input hand-drawn biological network, you will analyze it and generate the corresponding SBGNML content. Please provide your final answer in JSON format. Do not return any answer outside of this format.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: "Here is a stylesheet (learner's card) of SBGN PD shapes (glyphs and arcs) and their corresponding classes written in their right." },
          { type: 'image_url', image_url: { url: stylesheetImage } }
        ]
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: sampleImage } }
        ]
      },
      {
        role: 'assistant',
        content: JSON.stringify({ answer: sampleSBGNML })
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPromptWithComment },
          { type: 'image_url', image_url: { url: image } }
        ]
      }
    ];
  }

  if (language === 'AF') {
    const stylesheetImage = convertImageToBase64(
      path.join(assetsDir, 'sbgn_af_stylesheet.png')
    );
    const sampleImage = convertImageToBase64(path.join(assetsDir, 'AF_reference.png'));
    const sampleSBGNML = convertSBGNML(path.join(assetsDir, 'AF_reference.sbgn'));

    let userPrompt = 'Please generate the SBGNML for this hand-drawn SBGN-AF diagram. Please note that biological activity, phenotype, and, or, not, delay, tag nodes are represented with "glyph" tag in SBGNML AF and positive influence, negative influence, unknown influence, necessary simulation, logic arc and equivalence arc are represented with "arc" tag in SBGNML AF. Make sure that each element in the graph has the correct tag, this is very inportant. Please also make sure that each glyph has a label and bbox subtags and each arc has source and target defined as attribute inside arc tag (not as subtags). Take your time and act with careful consideration. Please provide your final answer in JSON format. Do not return any answer outside of this format. A template looks like this: {"answer": "SBGNML content as a STRING so that we can parse it (This is very important)"}. DO NOT enclose the JSON output in markdown code blocks like ```json and ```, make sure that you are returning a valid JSON (this is important).';
    let userPromptWithComment = userPrompt;
    if (comment) {
      userPromptWithComment = `${userPrompt} Additionally, please also consider the following comment during your process: ${comment}`;
    }

    return [
      {
        role: 'system',
        content: 'You are a helpful and professional assistant for converting hand-drawn biological networks drawn in Systems Biology Graphical Notation (SBGN) Activity Flow (AF) language and producing the corresponding SBGNML files. For an input hand-drawn biological network, you will analyze it and generate the corresponding SBGNML content. Please provide your final answer in JSON format. Do not return any answer outside of this format.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: "Here is a stylesheet (learner's card) of SBGN AF shapes (glyphs and arcs) and their corresponding classes written in their right." },
          { type: 'image_url', image_url: { url: stylesheetImage } }
        ]
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: sampleImage } }
        ]
      },
      {
        role: 'assistant',
        content: JSON.stringify({ answer: sampleSBGNML })
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPromptWithComment },
          { type: 'image_url', image_url: { url: image } }
        ]
      }
    ];
  }

  throw new Error(`Unsupported language: ${language}`);
};

export { convertImageToBase64, convertSBGNML, generateMessage };
