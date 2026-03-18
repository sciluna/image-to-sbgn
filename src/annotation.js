import { DOMParser, XMLSerializer } from "xmldom";

const addAnnotations = async function(sbgnml) {
  let nodeLabelArray = extractUniqueLabels(sbgnml);

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

  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  const xmlDoc = parser.parseFromString(sbgnml, "application/xml");

  const allNodes = xmlDoc.getElementsByTagName("*");

  for (let i = 0; i < allNodes.length; i++) {
    const glyph = allNodes[i];

    if (glyph.tagName !== "glyph") continue;

    const labels = glyph.getElementsByTagName("label");
    if (!labels.length) continue;

    const label = labels[0];
    const rawText = label.getAttribute("text");

    if (!rawText) continue;

    const text = rawText.trim().toUpperCase();

    const annotations = identifiersMap.get(text);
    if (!annotations) continue;

    const extension = xmlDoc.createElement("extension");
    const annotationEl = xmlDoc.createElement("annotation");

    const rdf = xmlDoc.createElementNS(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdf:RDF"
    );
    rdf.setAttribute("xmlns:rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    rdf.setAttribute("xmlns:bqbiol", "http://biomodels.net/biology-qualifiers/");

    const description = xmlDoc.createElementNS(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdf:Description"
    );
    description.setAttribute("rdf:about", `#${glyph.getAttribute("id")}`);

    const isEl = xmlDoc.createElementNS(
      "http://biomodels.net/biology-qualifiers/",
      "bqbiol:is"
    );

    const bag = xmlDoc.createElementNS(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdf:Bag"
    );

    annotations.forEach(a => {
      const li = xmlDoc.createElementNS(
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        "rdf:li"
      );
      li.setAttribute("rdf:resource", a.url);
      bag.appendChild(li);
    });

    isEl.appendChild(bag);
    description.appendChild(isEl);
    rdf.appendChild(description);
    annotationEl.appendChild(rdf);
    extension.appendChild(annotationEl);

    glyph.appendChild(extension);
  }

  return serializer.serializeToString(xmlDoc);
};

let mapIdentifiers = async function (nodeLabelArray) {
	let data = [];
	nodeLabelArray.forEach(label => {
		data.push({ text: label });
	});
	data = JSON.stringify(data);

  let url = "http://grounding.indra.bio/ground_multi";
  const settings = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: data
  };

  let result = await fetch(url, settings)
    .then(response => response.json())
    .then(result => {
      return result;
    })
    .catch(e => {
      console.log("Error!");
    });

  return result;
};

/**
 * Returns an array of unique glyph labels from SBGNML XML string
 */
const extractUniqueLabels = function(sbgnml) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(sbgnml, "application/xml");

  const glyphs = xmlDoc.getElementsByTagName("glyph");

  const labelSet = new Set();

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    const labels = glyph.getElementsByTagName("label");
    if (!labels.length) continue;

    const labelText = labels[0].getAttribute("text");
    if (labelText) {
      labelSet.add(labelText.trim());
    }
  }

  // Convert Set to Array
  return Array.from(labelSet);
}

export { addAnnotations };