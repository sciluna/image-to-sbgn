import cytoscape from 'cytoscape';
import fcose from "cytoscape-fcose";
import sbgnStylesheet from 'cytoscape-sbgn-stylesheet';
import contextMenus from 'cytoscape-context-menus';
import 'cytoscape-context-menus/cytoscape-context-menus.css';

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
			// image: {src : "remove.svg", width : 12, height : 12, x : 6, y : 4}, // menu icon
			// Filters the elements to have this menu item on cxttap
			// If the selector is not truthy no elements will have this menu item on cxttap
			selector: 'edge',
			coreAsWell: false, // Whether core instance have this item on cxttap
			submenu: [
				{
					id: 'consumption',
					content: 'Consumption',
					selector: 'edge[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'consumption');
					}
				},
				{
					id: 'production',
					content: 'Production',
					selector: 'edge[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'production');
					}
				},
				{
					id: 'modulation',
					content: 'Modulation',
					selector: 'edge[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'modulation');
					}
				},
				{
					id: 'stimulation',
					content: 'Stimulation',
					selector: 'edge[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'stimulation');
					}
				},
				{
					id: 'catalysis',
					content: 'Catalysis',
					selector: 'edge[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'catalysis');
					}
				},
				{
					id: 'inhibition',
					content: 'Inhibition',
					selector: 'edge[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'inhibition');
					}
				},
				{
					id: 'necessaryStimulation',
					content: 'Necessary stimulation',
					selector: 'edge',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'necessary stimulation');
					}
				},
				{
					id: 'logicArc',
					content: 'Logic arc',
					selector: 'edge',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'logic arc');
					}
				},
				{
					id: 'positiveInfluence',
					content: 'Positive influence',
					selector: 'edge[language = "AF"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'positive influence');
					}
				},
				{
					id: 'negativeInfluence',
					content: 'Negative influence',
					selector: 'edge[language = "AF"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'negative influence');
					}
				},
				{
					id: 'unknownInfluence',
					content: 'Unknown influence',
					selector: 'edge[language = "AF"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'unknown influence');
					}
				},
			]
		},
		{
			id: 'changeNodeClass', // ID of menu item
			content: 'Change class', // Display content of menu item
			// image: {src : "remove.svg", width : 12, height : 12, x : 6, y : 4}, // menu icon
			// Filters the elements to have this menu item on cxttap
			// If the selector is not truthy no elements will have this menu item on cxttap
			selector: 'node',
			coreAsWell: false, // Whether core instance have this item on cxttap
			submenu: [
				{
					id: 'macromolecule',
					content: 'Macromolecule',
					selector: 'node[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'macromolecule');
					}
				},
				{
					id: 'simpleChemical',
					content: 'Simple chemical',
					selector: 'node[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'simple chemical');
					}
				},
				{
					id: 'unspecifiedEntity',
					content: 'Unspecified entity',
					selector: 'node[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'unspecified entity');
					}
				},
				{
					id: 'nucleicAcidFeature',
					content: 'Nucleic acid feature',
					selector: 'node[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'nucleicAcidFeature');
					}
				},
				{
					id: 'perturbingAgent',
					content: 'Perturbing agent',
					selector: 'node[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'perturbing agent');
					}
				},
				{
					id: 'emptySet',
					content: 'Empty set',
					selector: 'node[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'empty set');
					}
				},
				{
					id: 'complex',
					content: 'Complex',
					selector: 'node[language = "PD"]',
					onClickFunction: function (event) {
						let target = event.target || event.cyTarget;
						target.data('class', 'complex');
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
					selector: 'node[language = "PD"]',
					submenu: [
						{
							id: 'process',
							content: 'Process',
							selector: 'node[language = "PD"]',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'process');
							}
						},
						{
							id: 'omittedProcess',
							content: 'Omitted process',
							selector: 'node[language = "PD"]',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'omitted process');
							}
						},
						{
							id: 'uncertainProcess',
							content: 'Uncertain process',
							selector: 'node[language = "PD"]',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'uncertain process');
							}
						},
						{
							id: 'association',
							content: 'association',
							selector: 'node[language = "PD"]',
							onClickFunction: function (event) {
								let target = event.target || event.cyTarget;
								target.data('class', 'association');
							}
						},
						{
							id: 'dissociation',
							content: 'dissociation',
							selector: 'node[language = "PD"]',
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
						},
					]
				},
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

let instance = cy.contextMenus(contextMenuOptions);

export { cy };