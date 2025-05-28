import libsbgnjs from 'libsbgn.js';

const convert = function (cy, mapLanguage) {

  const nodes = cy.nodes();
  const edges = cy.edges();

  const xmlHeader = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>";

  let sbgn = new libsbgnjs.Sbgn({ xmlns: 'http://sbgn.org/libsbgn/0.2' });

  let map = new libsbgnjs.Map({ language: mapLanguage });

  // get all glyphs
  let glyphList = [];
  nodes.forEach(function (ele, i) {
    if(childOfNone(ele, nodes)) {
      glyphList = glyphList.concat(getGlyphSbgnml(ele)); // returns potentially more than 1 glyph
    }
  });

  // add them to the map
  for (let i = 0; i < glyphList.length; i++) {
    if (glyphList[i] != undefined) {
      glyphList[i].extension = null;
      map.addGlyph(glyphList[i]);
    }
  }

  // get all arcs and add to map
  edges.forEach(function (ele) {
    let arc = getArcSbgnml(ele);
    arc.extension = null;
    map.addArc(arc);
  });

  sbgn.addMap(map);
  let sbgnString = sbgn.toXML();
  sbgnString = xmlHeader + sbgnString;
  return sbgnString;
};

const getGlyphSbgnml = function (node) {
  let nodeClass = node.data('class');
  let glyphList = [];

  let glyph = new libsbgnjs.Glyph({ id: node.data('id'), class_: nodeClass });

  // assign compartmentRef
  if (node.parent() && node.parent().length > 0) {
    if (nodeClass === "compartment") {
      glyph.compartmentRef = node.data('parent');
    }
    else {
      let parent = node.parent()[0];
      if (parent.data('class') == "compartment") {
        glyph.compartmentRef = parent.data('id');
      }
    }
  }

  // misc information
  // add label information
  let label = node.data('label');
  if (typeof label != 'undefined') {
    glyph.setLabel(new libsbgnjs.Label({ text: label }));
  }
  // add clone information
  if (typeof node.data('clonemarker') != 'undefined' && node.data('clonemarker')) {
    glyph.setClone(new libsbgnjs.CloneType());
  }
  // add bbox information
  glyph.setBbox(addGlyphBbox(node));

  // add port information
  if (node.data('ports')) {
    let ports = node.data('ports');
    for (let i = 0; i < ports.length; i++) {
      let orientation = ports[i].x === 0 ? 'vertical' : 'horizontal';
      // This is the ratio of the area occupied for ports over the whole shape
      let ratio = orientation === 'vertical' ? Math.abs(ports[i].y) / 50 : Math.abs(ports[i].x) / 50;

      // Divide the node sizes by the ratio because that sizes includes ports as well
      let x = node.position().x + ports[i].x * (node.width() / ratio) / 100;
      let y = node.position().y + ports[i].y * (node.height() / ratio) / 100;

      glyph.addPort(new libsbgnjs.Port({ id: ports[i].id, x: x, y: y }));
    }
  }

  // add state and info box information
  for (let i = 0; i < node.data('stateVariables').length; i++) {
    let boxGlyph = node.data('stateVariables')[i];
    let stateVariablesId = boxGlyph.id;
    glyph.addGlyphMember(addStateBoxGlyph(boxGlyph, stateVariablesId, node));
  };

  for (let i = 0; i < node.data('unitsOfInformation').length; i++) {
    let boxGlyph = node.data('unitsOfInformation')[i];
    let unitsOfInformationId = boxGlyph.id;
    glyph.addGlyphMember(addInfoBoxGlyph(boxGlyph, unitsOfInformationId, node));
  };

  // add glyph members that are not state variables or unit of info 
  if (nodeClass === "complex" || nodeClass === "complex multimer" || nodeClass === "submap") {
    let children = node.children();
    children = children.filter("[parent = '" + node.id() + "']")

    children.forEach(function (ele) {
      let glyphMemberList = getGlyphSbgnml(ele);
      for (let i = 0; i < glyphMemberList.length; i++) {
        glyph.addGlyphMember(glyphMemberList[i]);
      }
    });
  }

  // current glyph is done
  glyphList.push(glyph);

  // keep going with all the included glyphs
  if (nodeClass === "compartment") {
    let children = node.children();
    children = children.filter("[parent = '" + node.id() + "']")
    children.each(function (ele) {
      glyphList = glyphList.concat(getGlyphSbgnml(ele));
    });
  }

  return glyphList;
};

const addGlyphBbox = function (node) {
  let width = node.width();
  let height = node.height();

  let x = node.position().x - width / 2;
  let y = node.position().y - height / 2;

  return new libsbgnjs.Bbox({ x: x, y: y, w: width, h: height });
};

const addStateBoxGlyph = function (boxGlyph, id, mainGlyph) {
  let glyph = new libsbgnjs.Glyph({ id: id, class_: 'state variable' });
  let state = new libsbgnjs.StateType();
  if (typeof boxGlyph.state.value != 'undefined')
    state.value = boxGlyph.state.value;
  if (typeof boxGlyph.state.variable != 'undefined')
    state.variable = boxGlyph.state.variable;
  glyph.setState(state);
  glyph.setBbox(addStateAndInfoBbox(mainGlyph, boxGlyph));

  return glyph;
};

const addInfoBoxGlyph = function (boxGlyph, id, mainGlyph) {
  let glyph = new libsbgnjs.Glyph({ id: id, class_: 'unit of information' });
  let label = new libsbgnjs.Label();
  if (typeof boxGlyph.label.text != 'undefined')
    label.text = boxGlyph.label.text;
  glyph.setLabel(label);
  glyph.setBbox(addStateAndInfoBbox(mainGlyph, boxGlyph));

  return glyph;
};

const addStateAndInfoBbox = function (mainGlyph, boxGlyph) {
  let boxBbox;
  if (boxGlyph.bbox) {
    boxBbox = boxGlyph.bbox;
  } else {
    boxBbox = { x: 0, y: 0, w: 20, h: 10 };
  }
  let borderWidth = mainGlyph.css('border-width');
  let padding = mainGlyph.css('padding');
  let x = ((boxBbox.x * (mainGlyph.outerWidth() - borderWidth)) / 100) + (mainGlyph.position().x - mainGlyph.width() / 2 - padding - boxBbox.w / 2);
  let y = ((boxBbox.y * (mainGlyph.outerHeight() - borderWidth)) / 100) + (mainGlyph.position().y - mainGlyph.height() / 2 - padding - boxBbox.h / 2);

  return new libsbgnjs.Bbox({ x: x, y: y, w: boxBbox.w, h: boxBbox.h });
};

const getArcSbgnml = function (edge) {

  let arcTarget = edge.data('porttarget');
  let arcSource = edge.data('portsource');

  if (arcSource == null || arcSource.length === 0)
    arcSource = edge.data('source');

  if (arcTarget == null || arcTarget.length === 0)
    arcTarget = edge.data('target');

  let arcId = edge.data('id');
  let arc = new libsbgnjs.Arc({ id: arcId, source: arcSource, target: arcTarget, class_: edge.data('class') });

  arc.setStart(new libsbgnjs.StartType({ x: edge.sourceEndpoint().x, y: edge.sourceEndpoint().y }));

  arc.setEnd(new libsbgnjs.EndType({ x: edge.targetEndpoint().x, y: edge.targetEndpoint().y }));

  let cardinality = edge.data('cardinality');
  if (typeof cardinality != 'undefined' && cardinality != null && cardinality != 0) {
    let edgebBox = edge.boundingBox({ includeLabels: true, includeNodes: false, includeEdges: false, includeOverlays: false });
    arc.addGlyph(new libsbgnjs.Glyph({
      id: arc.id + '_card',
      class_: 'stoichiometry',
      label: new libsbgnjs.Label({ text: cardinality }),
      bbox: new libsbgnjs.Bbox({ x: edgebBox.x1, y: edgebBox.y1, w: edgebBox.w, h: edgebBox.h }) // dummy bbox, needed for format compliance
    }));
  }

  return arc;
};

let childOfNone = function (ele, nodes) {
  return !ele.isChild() || nodes.getElementById(ele.data('parent')).length === 0;
};

export { convert };