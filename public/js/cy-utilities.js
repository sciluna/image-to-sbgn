import cytoscape from 'cytoscape';
import fcose from "cytoscape-fcose";
import sbgnStylesheet from 'cytoscape-sbgn-stylesheet';

cytoscape.use(fcose);

let cy = window.cy = cytoscape({
	container: document.getElementById('cy'),
	style: sbgnStylesheet(cytoscape)
});

export { cy };