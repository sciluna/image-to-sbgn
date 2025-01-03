'use strict';

var cytoscape = require('cytoscape');
var fcose = require('cytoscape-fcose');
var sbgnStylesheet = require('cytoscape-sbgn-stylesheet');
var contextMenus = require('cytoscape-context-menus');
var convert = require('sbgnml-to-cytoscape');
var fileSaver = require('file-saver');

cytoscape.use(fcose);
cytoscape.use(contextMenus);

let cy = window.cy = cytoscape({
	container: document.getElementById('cy'),
	style: sbgnStylesheet(cytoscape)
});

var contextMenuOptions = {
	evtType: 'cxttap',
	// List of initial menu items
	// A menu item must have either onClickFunction or submenu or both
	menuItems: [
		{
			id: 'changeEdgeClass', // ID of menu item
			content: 'Change class', // Display content of menu item
			selector: "edge",
			coreAsWell: false, // Whether core instance have this item on cxttap
			submenu: [
				{
					id: 'consumption',
					content: 'Consumption',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'consumption');
					}
				},
				{
					id: 'production',
					content: 'Production',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'production');
					}
				},
				{
					id: 'modulation',
					content: 'Modulation',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'modulation');
					}
				},
				{
					id: 'stimulation',
					content: 'Stimulation',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'stimulation');
					}
				},
				{
					id: 'catalysis',
					content: 'Catalysis',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'catalysis');
					}
				},
				{
					id: 'inhibition',
					content: 'Inhibition',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'inhibition');
					}
				},
				{
					id: 'positiveInfluence',
					content: 'Positive influence',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'positive influence');
					}
				},
				{
					id: 'negativeInfluence',
					content: 'Negative influence',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'negative influence');
					}
				},
				{
					id: 'unknownInfluence',
					content: 'Unknown influence',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'unknown influence');
					}
				},
				{
					id: 'necessaryStimulation',
					content: 'Necessary stimulation',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'necessary stimulation');
					}
				},
				{
					id: 'logicArc',
					content: 'Logic arc',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'logic arc');
					}
				},
				{
					id: 'equivalence',
					content: 'Equivalence Arc',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'equivalence arc');
					}
				}
			]
		},
		{
			id: 'changeNodeClass', // ID of menu item
			content: 'Change class', // Display content of menu item
			selector: 'node',
			coreAsWell: false, // Whether core instance have this item on cxttap
			submenu: [
				{
					id: 'macromolecule',
					content: 'Macromolecule',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'macromolecule');
					}
				},
				{
					id: 'simpleChemical',
					content: 'Simple chemical',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'simple chemical');
					}
				},
				{
					id: 'unspecifiedEntity',
					content: 'Unspecified entity',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'unspecified entity');
					}
				},
				{
					id: 'nucleicAcidFeature',
					content: 'Nucleic acid feature',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'nucleicAcidFeature');
					}
				},
				{
					id: 'perturbingAgent',
					content: 'Perturbing agent',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'perturbing agent');
					}
				},
				{
					id: 'emptySet',
					content: 'Empty set',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'empty set');
					}
				},
				{
					id: 'complex',
					content: 'Complex',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'complex');
					}
				},
				{
					id: 'biologicalActivity',
					content: 'Biological activity',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'biological activity');
					}
				},
				{
					id: 'phenotype',
					content: 'Phenotype',
					selector: 'node',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'phenotype');
					}
				},
				{
					id: 'compartment',
					content: 'Compartment',
					selector: 'node',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'compartment');
					}
				},
				{
					id: 'tag',
					content: 'Tag',
					selector: 'node',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'tag');
					}
				},
				{
					id: 'process',
					content: 'Process',
					submenu: [
						{
							id: 'genericProcess',
							content: 'Process',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'process');
							}
						},
						{
							id: 'omittedProcess',
							content: 'Omitted process',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'omitted process');
							}
						},
						{
							id: 'uncertainProcess',
							content: 'Uncertain process',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'uncertain process');
							}
						},
						{
							id: 'association',
							content: 'Association',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'association');
							}
						},
						{
							id: 'dissociation',
							content: 'Dissociation',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'dissociation');
							}
						}
					]
				},
				{
					id: 'logicalOperator',
					content: 'Logical operator',
					selector: 'node',
					submenu: [
						{
							id: 'and',
							content: 'AND',
							selector: 'node',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'and');
							}
						},
						{
							id: 'or',
							content: 'OR',
							selector: 'node',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'or');
							}
						},
						{
							id: 'not',
							content: 'NOT',
							selector: 'node',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'not');
							}
						},
						{
							id: 'delay',
							content: 'Delay',
							selector: 'node[language = "AF"]',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'delay');
							}
						}
					]
				}
			]
		},
		{
			id: 'changeDirection',
			content: 'Change direction',
			selector: 'edge',
			onClickFunction: function (event) {
				let edge = event.target || event.cyTarget;
				let source = edge.source();
				let target = edge.target();
				edge.move({
					source: target.id(),
					target: source.id()
				});
			}
		},
		{
			id: 'remove',
			content: 'Remove',
			selector: 'node, edge',
			onClickFunction: function (event) {
				let target = event.target || event.cyTarget;
				target.remove();
			}
		},
		{
			id: 'addEdge',
			content: 'Add edge btw selected nodes',
			coreAsWell: true,
			onClickFunction: function (event) {
				const langauge = getMapType();
				if (cy.nodes(':selected').length > 1) {
					if (langauge == 'PD') {
						cy.add({ group: 'edges', data: { source: cy.nodes(':selected')[0].id(), target: cy.nodes(':selected')[1].id(), class: 'modulation' } });
					} else {
						cy.add({ group: 'edges', data: { source: cy.nodes(':selected')[0].id(), target: cy.nodes(':selected')[1].id(), class: 'positive influence' } });
					}
				}
			}
		},
		{
			id: 'addNode',
			content: 'Add node',
			coreAsWell: true,
			onClickFunction: function (event) {
				const langauge = getMapType();
				if (langauge == 'PD') {
					cy.add({ group: 'nodes', data: { class: 'macromolecule', label: 'Node', 'stateVariables': [], 'unitsOfInformation': [] }, position: { x: event.position.x, y: event.position.y } });
				} else {
					cy.add({ group: 'nodes', data: { class: 'biological activity', label: 'Node', 'stateVariables': [], 'unitsOfInformation': [] }, position: { x: event.position.x, y: event.position.y } });
				}
			}
		}
	],
	// css classes that menu items will have
	menuItemClasses: [
		// add class names to this list
	],
	// css classes that context menu will have
	contextMenuClasses: [
		// add class names to this list
	],
	// Indicates that the menu item has a submenu. If not provided default one will be used
	submenuIndicator: { src: 'img/submenu-indicator-default.svg', width: 12, height: 12 }
};

cy.contextMenus(contextMenuOptions);

let base64data;
let userInputText;
let sbgnmlText;
let img2sbgn = !(location.hostname === "localhost" || location.hostname === "127.0.0.1");

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
	loadSample('../../examples/' + filename);

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

let loadSample = function (fname) {
	cy.nodes().unselect();
	cy.remove(cy.elements());
	fetch(fname).then(function (res) {
		return res.blob();
	}).then(blob => new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = function () {
			base64data = reader.result;
			let output = document.getElementById('inputImage');
			output.src = base64data;
			output.style.removeProperty('width');
			output.style.maxHeight = "100%";
			sbgnmlText = undefined;
		};
		reader.readAsDataURL(blob);
	}));
};

$("#load-file").on("click", function (e) {
	$("#file-input").trigger('click');
});

document.getElementById("file-input").addEventListener("change", async function (file) {
	let input = file.target;
	let reader = new FileReader();
	reader.onload = function () {
		base64data = reader.result;
		let output = document.getElementById('inputImage');
		output.src = base64data;
		output.style.removeProperty('width');
		output.style.maxHeight = "100%";
		sbgnmlText = undefined;
	};
	reader.readAsDataURL(input.files[0]);
});

document.getElementById("downloadSbgnml").addEventListener("click", function () {
	let blob = new Blob([sbgnmlText], { type: "text/xml" });
	fileSaver.saveAs(blob, "newFile.sbgnml");
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

// evaluate positions
let communicate = async function (pngBase64, userInputText) {

	/* 	let data = {
			comment: 'This image shows a biological network. I want you to evaluate this image, produce the corresponding SBGN Process Description representation and return the resulting SBGNML content. Take your time and think carefully about the node and relation types. Here are some considerations to take into account: - Make sure that each glyph has a bbox and each arc has source and target defined (This is important.). - Nodes are represented as rectangles in the image except process, and, or, not, empty set nodes. - Nodes can have the following classes: macromolecule, simple chemical, complex, compartment, process, unspecified entity, nucleic acid feature, perturbing agent, and, or, not, empty set in SBGN. - There can be nested nodes (nodes inside nodes). In these cases progress from outer rectangle to the inner ones. - If a node does have an inner node then classify the outer node as complex. - Try to infer class of each node, which does not have an inner node, based on its label inside or from its shape in case of empty set. - Edges can have the following classes: consumption, production, modulation, catalysis, stimulation, inhibition, necessary stumilation. - If there is a direct line with an arrow at the end from one node to another, then represent this line with two SBGN edges (one consumption and one production) with a process node in between. - If there are dots between nodes that connect edges, apply the following: a- Classify dot as a process node and assign a bbox for it. b- If there is a line between a node and a dot without arrow at the ends, classify that line as consumption edge. c- If there is a line between a dot and a node with an arrow on the node side, classify that line as production edge. d- If there is a line between a dot and a node with an arrow on the dot side, try to infer edge class from the text next to the line. While generating your answer, please describe what made you come to your conclusion (thoughts). Also state your final conclusion as SBGNML text (answer).' + userInput + ' Whenever you are not sure you are kindly asked to make an informed guess about the node/edge class as best as you can. Here is the patient image:',
			image: pngBase64
		}; */

	let data = {
		comment: userInputText,
		image: pngBase64
	};

	let response = await sendRequestToGPT(data);
	let resultJSON;
	try {
		resultJSON = JSON.parse(response);
		sbgnmlText = resultJSON.answer;
		console.log(sbgnmlText);
		sbgnmlText = sbgnmlText.replaceAll('\"', '"');
		sbgnmlText = sbgnmlText.replaceAll('\n', '');
		sbgnmlText = sbgnmlText.replaceAll('empty set', 'source and sink');
		console.log(sbgnmlText);
		await generateCyGraph();
	} catch (error) {
		alert("Output SBGNML from GPT is not in the correct format! Please try again!");
		console.log("Output SBGNML is not in the correct format");
		document.getElementById("processData").style.backgroundColor = "#d67664";
		document.getElementById("processData").classList.remove("loading");
	}
};

let sendRequestToGPT = async function (data) {
	let language = getMapType();
	let url = "http://localhost:4000/gpt?language=" + language;
	if (img2sbgn) {
		url = "http://ec2-3-87-167-56.compute-1.amazonaws.com/gpt?language=" + language;
	}
	const settings = {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'text/plain'
		},
		body: JSON.stringify(data)
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
	let identifiers = await mapIdentifiers(nodesToQuery);

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
	document.getElementById("processData").style.backgroundColor = "#d67664";
	document.getElementById("processData").classList.remove("loading");
};

let mapIdentifiers = async function (nodesToQuery) {
	let data = [];
	nodesToQuery.forEach(item => {
		data.push({ text: item });
	});
	data = JSON.stringify(data);
	let url = "http://localhost:4000/anno/";
	if (img2sbgn) {
		url = "http://ec2-3-87-167-56.compute-1.amazonaws.com/anno/";
	}
	const settings = {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'text/plain'
		},
		body: data
	};

	let identifiers = await fetch(url, settings)
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

		labelInput.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				title.textContent = labelInput.value;
				div.replaceChild(title, labelInput);
				node.data('label', title.textContent);
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

document.getElementById("inputImage").addEventListener("click", function () {
	let imageContent = document.getElementById("imageContent");
	imageContent.src = base64data;
	$('#imageModal').modal({ inverted: true }).modal('show');
});
