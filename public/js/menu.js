import { cy } from './cy-utilities.js';
import convert from 'sbgnml-to-cytoscape';
import { convert as cytoscapeToSbgnml } from './cytoscape-to-sbgnml.js'
import { saveAs } from 'file-saver';
import format from 'xml-formatter';

let base64data;
let userInputText;
let sbgnmlText;
let img2sbgn = !(location.hostname === "localhost" || location.hostname === "127.0.0.1");
let sbgnmlfilename = "";

document.getElementById("samples").addEventListener("change", function (event) {
	let sample = event.target.value;
	let filename = "";
	if (sample == "sample1") {
		filename = "PD_sample1.png";
	}
	else if (sample == "sample2") {
		filename = "PD_sample2.png";
	}
	else if (sample == "sample3") {
		filename = "PD_sample3.png";
	}
	else if (sample == "sample4") {
		filename = "PD_sample4.png";
	}
	else if (sample == "sample5") {
		filename = "AF_sample1.png";
	}
	else if (sample == "sample6") {
		filename = "AF_sample1_black_white.png";
	}
	else if (sample == "sample7") {
		filename = "AF_sample2.png";
	}
	loadSample('examples/' + filename);

	const selectedSample = this.value;

	// Get the radio buttons
	const radioPD = document.getElementById('radioPD');
	const radioAF = document.getElementById('radioAF');

	// Uncheck both radios
	radioPD.checked = false;
	radioAF.checked = false;

	// Check the appropriate radio based on the selected sample
	if (selectedSample === 'sample1' || selectedSample === 'sample2' || selectedSample === 'sample3' || selectedSample === 'sample4') {
		radioPD.checked = true; // PD for sample1
	} else if (selectedSample === 'sample5' || selectedSample === 'sample6' || selectedSample === 'sample7') {
		radioAF.checked = true; // AF for sample2
	}
});

function getMapType() {
	// Get all radio buttons with the name 'language'
	const radios = document.getElementsByName('language');

	// Loop through the radio buttons and return the one that's checked
	for (let i = 0; i < radios.length; i++) {
		if (radios[i].checked) {
			return radios[i].nextElementSibling.innerText; // Get the label text (PD or AF)
		}
	}
	return null; // If none are checked
}

function getProviderType() {
	// Get all radio buttons with the name 'model'
	const radios = document.getElementsByName('provider');

	// Loop through the radio buttons and return the one that's checked
	for (let i = 0; i < radios.length; i++) {
		if (radios[i].checked) {
			return radios[i].id; // Get the model id (openai or gemini)
		}
	}
	return null; // If none are checked
}

let loadSample = function (fname) {
	cy.nodes().unselect();
	cy.remove(cy.elements());
	fetch(fname).then(function (res) {
		return res.blob();
	}).then(blob => new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = function () {
			base64data = reader.result;
			let output = document.getElementById('inputImage');
			output.src = base64data;
			output.style.removeProperty('width')
			output.style.maxHeight = "100%";
			sbgnmlText = undefined;
		};
		reader.readAsDataURL(blob)
	}))
};

$("#load-file").on("click", function (e) {
	$("#file-input").trigger('click');
});

$("#upload-file").on("click", function (e) {
	$("#file-input-cy").trigger('click');
});

document.getElementById("file-input").addEventListener("change", async function (file) {
	let input = file.target;
	let reader = new FileReader();
	reader.onload = function () {
		base64data = reader.result;
		let output = document.getElementById('inputImage');
		output.src = base64data;
		output.style.removeProperty('width')
		output.style.maxHeight = "100%";
		sbgnmlText = undefined;
	};
	reader.readAsDataURL(input.files[0]);
});

document.getElementById("file-input-cy").addEventListener("change", async function (event) {
	const files = Array.from(event.target.files);

	files.forEach(async (file) => {
    if (file.name.endsWith('.json')) {
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        cy.elements().remove();
        cy.json({elements: json.elements});
				cy.layout({name: "preset"}).run();
				let finalSbgnml = cytoscapeToSbgnml(cy, "activity flow");
				finalSbgnml = format(finalSbgnml);
				let blob = new Blob([finalSbgnml], { type: "text/xml" });
				saveAs(blob, file.name.replace(/\.[^/.]+$/, "") + ".sbgnml");

      } catch (err) {
        console.error(`Failed to parse ${file.name}:`, err);
      }
    }
	});

/* 	let input = file.target;
	let reader = new FileReader();
	reader.onload = function () {
		let cyJson = JSON.parse(reader.result);
		cy.json({elements: cyJson.elements});
	};
	reader.readAsText(input.files[0]); */
});

document.getElementById("downloadSbgnml").addEventListener("click", function () {
	let finalSbgnml = cytoscapeToSbgnml(cy, getMapType());
	finalSbgnml = format(finalSbgnml);
	let blob = new Blob([finalSbgnml], { type: "text/xml" });
	saveAs(blob, sbgnmlfilename);
});

document.getElementById("processData").addEventListener("click", function (e) {
	if (base64data !== undefined) {
		// remove object view content
		let objectView = document.getElementById("objectView");
		if (objectView.querySelector("#objectData") != null) {
			let objectData = document.getElementById("objectData");
			objectView.removeChild(objectData);
		}
		// reset other data
		sbgnmlText = undefined;
		cy.remove(cy.elements());
		cy.nodes().unselect();
		e.currentTarget.style.backgroundColor = "#f2711c";
		e.currentTarget.className += " loading";
		userInputText = document.getElementById("userInputText").value;
		communicate(base64data, userInputText);
	}
	else {
		document.getElementById("file-type").textContent = "You must first load a valid file!";
	}
});

document.getElementById("applyLayout").addEventListener("click", function () {
	cy.layout({ name: 'fcose', randomize: false, initialEnergyOnIncremental: 0.5 }).run();
});

document.getElementById("openNewt").addEventListener("click", async function () {
	let finalSbgnml = cytoscapeToSbgnml(cy, getMapType());
	finalSbgnml = format(finalSbgnml);
	const filename = await openInNewtAndDelete(finalSbgnml);
});

// evaluate positions
let communicate = async function (pngBase64, userInputText) {
	let imageHeader = "data:image/png;base64,";
	let finalImage = imageHeader.concat(pngBase64);

	/* 	let data = {
			comment: 'This image shows a biological network. I want you to evaluate this image, produce the corresponding SBGN Process Description representation and return the resulting SBGNML content. Take your time and think carefully about the node and relation types. Here are some considerations to take into account: - Make sure that each glyph has a bbox and each arc has source and target defined (This is important.). - Nodes are represented as rectangles in the image except process, and, or, not, empty set nodes. - Nodes can have the following classes: macromolecule, simple chemical, complex, compartment, process, unspecified entity, nucleic acid feature, perturbing agent, and, or, not, empty set in SBGN. - There can be nested nodes (nodes inside nodes). In these cases progress from outer rectangle to the inner ones. - If a node does have an inner node then classify the outer node as complex. - Try to infer class of each node, which does not have an inner node, based on its label inside or from its shape in case of empty set. - Edges can have the following classes: consumption, production, modulation, catalysis, stimulation, inhibition, necessary stumilation. - If there is a direct line with an arrow at the end from one node to another, then represent this line with two SBGN edges (one consumption and one production) with a process node in between. - If there are dots between nodes that connect edges, apply the following: a- Classify dot as a process node and assign a bbox for it. b- If there is a line between a node and a dot without arrow at the ends, classify that line as consumption edge. c- If there is a line between a dot and a node with an arrow on the node side, classify that line as production edge. d- If there is a line between a dot and a node with an arrow on the dot side, try to infer edge class from the text next to the line. While generating your answer, please describe what made you come to your conclusion (thoughts). Also state your final conclusion as SBGNML text (answer).' + userInput + ' Whenever you are not sure you are kindly asked to make an informed guess about the node/edge class as best as you can. Here is the patient image:',
			image: pngBase64
		}; */

	let language = getMapType();
	let provider = getProviderType();
	let model = "gpt-5.2";
/* 	if(provider == "gemini") {
		model = "gemini-2.0-flash-001";
	} */
	let data = {
		comment: userInputText,
		image: pngBase64,
		language: language,
		//provider: provider,
		model: model
	};

	let response = await sendRequestToGPT(data);
	let resultJSON;
	try {
		resultJSON = JSON.parse(response);
		sbgnmlText = resultJSON.answer;
		sbgnmlText = sbgnmlText.replaceAll('\"', '"');
		sbgnmlText = sbgnmlText.replaceAll('\n', '');
		sbgnmlText = sbgnmlText.replaceAll('empty set', 'source and sink');
		//console.log(sbgnmlText);
		await generateCyGraph();
	} catch (error) {
		alert("Output SBGNML from GPT is not in the correct format! Please try again!");
		console.log("Output SBGNML is not in the correct format");
		document.getElementById("processData").style.backgroundColor = "#d67664";
		document.getElementById("processData").classList.remove("loading");
	}
};

let sendRequestToGPT = async function (data) {
	const settings = {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'text/plain'
		},
		body: JSON.stringify(data)
	};

	let res = await fetch('gpt', settings)
		.then(response => response.json())
		.then(result => {
			return result;
		})
		.catch(e => {
			console.log("Error!");
		});

	return res;
};

// send request to sbgn validator (sybvals) to validate the resulting sbgnml content
let sendRequestToValidator = async function (sbgnmlContent) {
	let url = "http://sybvals.cs.bilkent.edu.tr/validation=showResolutionAlternatives=true";
	const settings = {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'text/plain'
		},
		body: sbgnmlContent
	};

	let res = await fetch(url, settings)
		.then(response => response.json())
		.then(result => {
			return result;
		})
		.catch(e => {
			console.log("Error!");
		});

	return res;
};

let generateCyGraph = async function () {
	let cyGraph = convert(sbgnmlText);
	cy.remove(cy.elements());
	cy.add(cyGraph);
	cy.nodes().forEach(
		(node) => {
			node.position({ x: node.data('bbox').x + node.data('bbox').w / 2, y: node.data('bbox').y + node.data('bbox').h / 2 });
		}
	);
	// adjust context menu items
	let language = getMapType();
	let contextMenu = cy.contextMenus('get');
	let pdItemIDs = ["consumption", "production", "modulation", "stimulation", "catalysis", "inhibition", "macromolecule", "simpleChemical", "unspecifiedEntity", "nucleicAcidFeature", "perturbingAgent", "emptySet", "complex", "process"];
	let afItemIDs = ["positiveInfluence", "negativeInfluence", "unknownInfluence", "biologicalActivity", "delay"];
	if (language == "PD") {
		pdItemIDs.forEach(itemID => {
			contextMenu.showMenuItem(itemID);
		});
		afItemIDs.forEach(itemID => {
			contextMenu.hideMenuItem(itemID);
		});
	} else if (language == "AF") {
		pdItemIDs.forEach(itemID => {
			contextMenu.hideMenuItem(itemID);
		});
		afItemIDs.forEach(itemID => {
			contextMenu.showMenuItem(itemID);
		});
	}
	// apply layout
	cy.layout({ name: 'fcose', randomize: false }).run();
	// apply identifier mapping
	let nodesToQuery = cy.nodes().filter(node => {
		return node.data("label");
	});
	nodesToQuery = nodesToQuery.map(node => {
		return node.data("label");
	});
	nodesToQuery = nodesToQuery.filter((value, index, array) => {
		return array.indexOf(value) === index;
	});
	await setIdentifiers(nodesToQuery);

	document.getElementById("processData").style.backgroundColor = "#d67664";
	document.getElementById("processData").classList.remove("loading");
};

async function setIdentifiers (nodeLabelArray){
	let identifiers = await mapIdentifiers(nodeLabelArray);

	let identifiersMap = new Map();
	identifiers.forEach(item => {
		item.forEach(data => {
			if (data.score >= 0.6) {
				let query = data.match.query;
				let content = { db: data.term.db, id: data.term.id, url: data.url };
				if (identifiersMap.has(query)) {
					identifiersMap.get(query).push(content);
				} else {
					identifiersMap.set(query, [content]);
				}
			}
		});
	});
	console.log(identifiersMap);
	identifiersMap.forEach((value, key, map) => {
		let cyNodes = cy.nodes().filter(node => {
			return node.data('label') == key;
		});
		cyNodes.forEach(cyNode => {
			cyNode.data("identifierData", value);
		});
	});
};

let mapIdentifiers = async function (nodesToQuery) {
	let data = [];
	nodesToQuery.forEach(item => {
		data.push({ text: item });
	});
	data = JSON.stringify(data);

	const settings = {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'text/plain'
		},
		body: data
	};

	let identifiers = await fetch('anno', settings)
		.then(response => response.json())
		.then(result => {
			return result;
		})
		.catch(e => {
			console.log("Error!");
		});

	return identifiers;
};

let generateObjectContent = function (node, identifierData) {
	// Create the main div element
	const div = document.createElement('div');
	div.setAttribute("id", "objectData");

	// Create a title for the id
	const title = document.createElement('h3');
	title.textContent = node.data('label');

	// Create an edit icon 
	const editIcon = document.createElement('span');
	editIcon.textContent = '✏️'; // You can replace this with an icon image if needed
	editIcon.style.cursor = 'pointer';
	editIcon.style.marginLeft = '10px';

	// Add an event listener to switch to input field when clicked
	editIcon.addEventListener('click', () => {
		// Replace h3 with an input field
		const labelInput = document.createElement('input');
		labelInput.setAttribute("type", "text");
		labelInput.setAttribute("id", "labelInput");
		labelInput.value = title.textContent; // Set the current label text as input value

		labelInput.addEventListener('keydown', async (event) => {
			if (event.key === 'Enter') {
				title.textContent = labelInput.value;
				div.replaceChild(title, labelInput);
				node.data('label', title.textContent);
				await setIdentifiers([node.data('label')]);
				node.unselect();
				node.select();
			}
		});

		div.replaceChild(labelInput, title); // Replace h3 with input
	});

	div.appendChild(title);
	div.appendChild(editIcon);

	if (node.data("identifierData")) {
		// Loop through the dataArray and generate content for each object
		identifierData.forEach((dataItem) => {

			// Create a table with Fomantic UI classes
			const table = document.createElement('table');
			table.className = 'ui celled table';

			// Create a table body
			const tbody = document.createElement('tbody');

			// Create a row for each object in dataArray
			const row = document.createElement('tr');

			const dbCell = document.createElement('td');
			dbCell.textContent = dataItem.db;

			const idCell = document.createElement('td');
			const link = document.createElement('a');
			link.href = dataItem.url;
			link.textContent = dataItem.id;
			link.target = '_blank';
			idCell.appendChild(link);

			row.appendChild(dbCell);
			row.appendChild(idCell);
			tbody.appendChild(row);

			table.appendChild(tbody);
			div.appendChild(table);
		});
	}

	return div;
};

cy.on("select", "node", function (evt) {
	let node = evt.target;
	if (node.data("label") && node.data("label") != "") {
		let objectContent = generateObjectContent(node, node.data("identifierData"));
		let objectView = document.getElementById("objectView");
		objectView.appendChild(objectContent);
	}
});

cy.on("unselect", "node", function (evt) {
	let objectView = document.getElementById("objectView");
	if (objectView.querySelector("#objectData") != null) {
		let objectData = document.getElementById("objectData");
		objectView.removeChild(objectData);
	}
});

async function openInNewtAndDelete(sbgnContent) {
	let filename = 'diagram_' + Date.now() + '.sbgnml';
  const response = await fetch('upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: filename,
      content: sbgnContent,
    }),
  });

  const data = await response.json();
  if (data.url) {
    // Redirect to Newt Editor with the file URL
    window.open(`https://web.newteditor.org/?URL=${data.url}`, '_blank');

		setTimeout(() => {
			fetch('delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ filename }),
			})
				.then((res) => res.json())
				.then((data) => {
					console.log('File deletion result:', data);
				})
				.catch((err) => {
					console.error('Failed to delete file:', err);
				});
		}, 5000); // 5000 ms = 5 seconds
  }
	return data.filename;
}

document.getElementById("inputImage").addEventListener("click", function () {
	let imageContent = document.getElementById("imageContent");
	imageContent.src = base64data;
	$('#imageModal').modal({ inverted: true }).modal('show');
});

export { sendRequestToGPT, getMapType };
