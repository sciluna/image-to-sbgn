import { cy } from './cy-utilities';
import convert from 'sbgnml-to-cytoscape';
import { saveAs } from 'file-saver';

let base64data;
let userInputText;
let sbgnmlText;
let img2sbgn = !(location.hostname === "localhost" || location.hostname === "127.0.0.1");

document.getElementById("samples").addEventListener("change", function (event) {
	let sample = event.target.value;
	let filename = "";
	if(sample == "sample1") {
		filename = "sample1.png";
	}
	else if(sample == "sample2") {
		filename = "sample2.png";
	}
	else if(sample == "sample3") {
		filename = "sample3.png";
	}
	loadSample('../../examples/' + filename);
});

let loadSample = function (fname) {
	cy.remove(cy.elements());
	fetch(fname).then(function (res) {
		return res.blob();
	}).then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = function(){
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

document.getElementById("file-input").addEventListener("change", async function (file) {
  let input = file.target;
  let reader = new FileReader();
  reader.onload = function(){
    base64data = reader.result;
    let output = document.getElementById('inputImage');
    output.src = base64data;
		output.style.removeProperty('width')
		output.style.maxHeight = "100%";
		sbgnmlText = undefined;
  };
  reader.readAsDataURL(input.files[0]);
});

document.getElementById("downloadSbgnml").addEventListener("click", function () {
	let blob = new Blob([sbgnmlText], {type: "text/xml"});
	saveAs(blob, "newFile.sbgnml");
});

document.getElementById("processData").addEventListener("click", function (e) {
	if(base64data !== undefined) {
		userInputText = document.getElementById("userInputText").value;
		sbgnmlText = undefined;
		cy.remove(cy.elements());
		e.currentTarget.style.backgroundColor = "#f2711c";
		e.currentTarget.className += " loading";
		communicate(base64data, userInputText);
	}
	else {
		document.getElementById("file-type").textContent = "You must first load a valid file!";
	}
});

document.getElementById("applyLayout").addEventListener("click", function () {
	cy.layout({ name: 'fcose', randomize: false, initialEnergyOnIncremental: 0.5}).run();
});

// evaluate positions
let communicate = async function (pngBase64, userInputText) {
	let imageHeader = "data:image/png;base64,";
	let finalImage = imageHeader.concat(pngBase64);

/* 	let data = {
		comment: 'This image shows a biological network. I want you to evaluate this image, produce the corresponding SBGN Process Description representation and return the resulting SBGNML content. Take your time and think carefully about the node and relation types. Here are some considerations to take into account: - Make sure that each glyph has a bbox and each arc has source and target defined (This is important.). - Nodes are represented as rectangles in the image except process, and, or, not, empty set nodes. - Nodes can have the following classes: macromolecule, simple chemical, complex, compartment, process, unspecified entity, nucleic acid feature, perturbing agent, and, or, not, empty set in SBGN. - There can be nested nodes (nodes inside nodes). In these cases progress from outer rectangle to the inner ones. - If a node does have an inner node then classify the outer node as complex. - Try to infer class of each node, which does not have an inner node, based on its label inside or from its shape in case of empty set. - Edges can have the following classes: consumption, production, modulation, catalysis, stimulation, inhibition, necessary stumilation. - If there is a direct line with an arrow at the end from one node to another, then represent this line with two SBGN edges (one consumption and one production) with a process node in between. - If there are dots between nodes that connect edges, apply the following: a- Classify dot as a process node and assign a bbox for it. b- If there is a line between a node and a dot without arrow at the ends, classify that line as consumption edge. c- If there is a line between a dot and a node with an arrow on the node side, classify that line as production edge. d- If there is a line between a dot and a node with an arrow on the dot side, try to infer edge class from the text next to the line. While generating your answer, please describe what made you come to your conclusion (thoughts). Also state your final conclusion as SBGNML text (answer).' + userInput + ' Whenever you are not sure you are kindly asked to make an informed guess about the node/edge class as best as you can. Here is the patient image:',
		image: pngBase64
	}; */

	let data = {
		comment: userInputText,
		image: pngBase64
	};

	let response = await sendRequestToGPT(data);
	let resultJSON = JSON.parse(response);
	sbgnmlText = resultJSON.answer;
	console.log(sbgnmlText);
	sbgnmlText = sbgnmlText.replaceAll('\"', '"');
	sbgnmlText = sbgnmlText.replaceAll('\n', '');
	sbgnmlText = sbgnmlText.replaceAll('empty set', 'source and sink');
	console.log(sbgnmlText);
	await generateCyGraph();
};

let sendRequestToGPT = async function (data){
	let url = "http://localhost:4000/gpt/";
	if(img2sbgn) {
		url = "http://ec2-54-224-126-212.compute-1.amazonaws.com/gpt/";
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

// send request to sbgn validator (sybvals) to validate the resulting sbgnml content
let sendRequestToValidator = async function (sbgnmlContent){
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
			node.position({x:  node.data('bbox').x + node.data('bbox').w / 2, y: node.data('bbox').y + node.data('bbox').h / 2});
		}
	);
	cy.layout({ name: 'fcose', randomize: false }).run();
	let nodesToQuery = cy.nodes().filter(node => {
		return node.data("label");
	});
	nodesToQuery = nodesToQuery.map(node => {
		return node.data("label");
	});
	let identifiers = await mapIdentifiers(nodesToQuery);

	let identifiersMap = new Map();
	identifiers.forEach(item => {
		item.forEach(data => {
			if (data.score >= 0.6) {
				let query = data.match.query;
				let content = {db: data.term.db, id: data.term.id, url: data.url};
				if (identifiersMap.has(query)) {
					identifiersMap.set(query, identifiersMap.get(query).push(content));
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

let mapIdentifiers = async function(nodesToQuery) {
	let data = [];
	nodesToQuery.forEach(item => {
		data.push({text: item});
	});
	data = JSON.stringify(data);
	let url = "http://localhost:4000/anno/";
	if(img2sbgn) {
		url = "http://ec2-54-224-126-212.compute-1.amazonaws.com/anno/";
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

 let generateObjectContent = function(nodeLabel, identifierData) {
  // Create the main div element
  const div = document.createElement('div');
	div.setAttribute("id", "objectData");

  // Loop through the dataArray and generate content for each object
  identifierData.forEach((dataItem) => {
    // Create a title for the id
    const title = document.createElement('h3');
    title.textContent = nodeLabel;
    div.appendChild(title);

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

  return div;
};

cy.on("select", "node", function(evt){
	let node = evt.target;
	if(node.data("label") && node.data("label") != "" && node.data("identifierData")) {
		let objectContent = generateObjectContent(node.data("label"), node.data("identifierData"));
		let objectView = document.getElementById("objectView");
		objectView.appendChild(objectContent);
	}
});

cy.on("unselect", "node", function(evt){
	let objectView = document.getElementById("objectView");
	if(objectView.querySelector("#objectData") != null) {
		let objectData = document.getElementById("objectData");
		objectView.removeChild(objectData);
	}
});

document.getElementById("inputImage").addEventListener("click", function () {
  let imageContent = document.getElementById("imageContent");
  imageContent.src = base64data;
  $('#imageModal').modal({inverted: true}).modal('show');
});

export { sendRequestToGPT };
