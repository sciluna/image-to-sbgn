'use strict';

var cytoscape = require('cytoscape');
var fcose = require('cytoscape-fcose');
var sbgnStylesheet = require('cytoscape-sbgn-stylesheet');
var convert = require('sbgnml-to-cytoscape');
var fileSaver = require('file-saver');

cytoscape.use(fcose);

let cy = window.cy = cytoscape({
	container: document.getElementById('cy'),
	style: sbgnStylesheet(cytoscape)
});

let base64data = "";
let userInputText = "";
let sbgnmlText = "";

document.getElementById("samples").addEventListener("change", function (event) {
	let sample = event.target.value;
	let filename = "";
	if(sample == "sample1") {
		filename = "glycolysis_sbgn.png";
	}
	else if(sample == "sample2") {
		filename = "repressilator.png";
	}
	else if(sample == "sample3") {
		filename = "stat1alpha.png";
	}
	else if(sample == "sample4") {
		filename = "glycolysis_2.png";
	}
	loadSample('../../examples/' + filename);
});

let loadSample = function (fname) {
	cy.remove(cy.elements());
	fetch(fname).then(function (res) {
		return res.blob();
	}).then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(){
			base64data = reader.result;
			let output = document.getElementById('inputImage');
			output.src = base64data;
			output.style.removeProperty('width');
			output.style.maxHeight = "100%";
			sbgnmlText = "";
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
  reader.onload = function(){
    base64data = reader.result;
    let output = document.getElementById('inputImage');
    output.src = base64data;
		output.style.removeProperty('width');
		output.style.maxHeight = "100%";
		sbgnmlText = "";
  };
  reader.readAsDataURL(input.files[0]);
});

document.getElementById("downloadSbgnml").addEventListener("click", function () {
	let blob = new Blob([sbgnmlText], {type: "text/xml"});
	fileSaver.saveAs(blob, "newFile.sbgnml");
});

document.getElementById("processData").addEventListener("click", function () {
	userInputText = document.getElementById("userInputText").value;
	sbgnmlText = "";
	cy.remove(cy.elements());
	communicate(base64data, userInputText);
});

document.getElementById("applyLayout").addEventListener("click", function () {
	cy.layout({ name: 'fcose', randomize: false }).run();
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
	await mapIdentifiers(nodesToQuery);
};

let mapIdentifiers = async function(nodesToQuery) {
	let data = [];
	nodesToQuery.forEach(item => {
		data.push({text: item});
	});
	data = JSON.stringify(data);
	//console.log(data);
	//let url = "http://localhost:4000/anno/";
	let url = "http://grounding.indra.bio/ground_multi";
	const settings = {
		mode:  'no-cors',
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'text/plain'
		},
		body: data
	};

	let res = await fetch(url, settings)
	.then(response => response.json())
	.then(result => {
		return result;
	})
	.catch(e => {
		console.log("Error!");
	});
	console.log(res);
};
