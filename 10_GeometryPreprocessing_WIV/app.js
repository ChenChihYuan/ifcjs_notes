import { Color, Line } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { 
    IFCWALL,
    IFCWALLSTANDARDCASE,
    IFCSLAB,
    IFCWINDOW,
    IFCMEMBER,
    IFCPLATE,
    IFCCURTAINWALL,
    IFCDOOR
 } from "web-ifc";

const container = document.getElementById('viewer-container');  
const viewer = new IfcViewerAPI({container, backgroundColor: new Color(0xffffff)});
viewer.axes.setAxes();
viewer.grid.setGrid();
// viewer.IFC.loadIfcUrl('./02.ifc'); // load ifc file from url
Load('./02.ifc');

// preprocessing Geometry ifc -> glb + json

// async function Load(url){
//     const result = await viewer.GLTF.exportIfcFileAsGltf({
//         ifcFileUrl: url,
//         getProperties: true,
//         splitByFloors: true,
//         categories: {
//             walls: [IFCWALL, IFCWALLSTANDARDCASE],
//             slabs: [IFCSLAB],
//             windows: [IFCWINDOW],
//             curtainwalls: [IFCMEMBER, IFCPLATE, IFCCURTAINWALL],
//             doors: [IFCDOOR]
//         },
//         getProperties: true
//     });
    
//     const link = document.createElement('a');
//     document.body.appendChild(link)

//     for(const categoryName in result.gltf) {
//         const category = result.gltf[categoryName];
//         for(const levelName in category) {
//             const file = category[levelName].file;
//             if(file) {
//                 link.download = `${file.name}_${categoryName}_${levelName}.gltf`;
//                 link.href = URL.createObjectURL(file);
//                 link.click();
//             }
//         }
//     }

//     for(let jsonFile of result.json){
//         link.download = `${jsonFile.name}.json`;
//         link.href = URL.createObjectURL(jsonFile);
//         link.click();
//     }

// }
let properties;

async function Load(url){
    await viewer.GLTF.loadModel('./result/model-part.gltf_curtainwalls_Nivel 1.gltf')
    await viewer.GLTF.loadModel('./result/model-part.gltf_curtainwalls_Nivel 2.gltf')
    await viewer.GLTF.loadModel('./result/model-part.gltf_slabs_Nivel 1.gltf')
    await viewer.GLTF.loadModel('./result/model-part.gltf_slabs_Nivel 2.gltf')
    await viewer.GLTF.loadModel('./result/model-part.gltf_slabs_Nivel 3.gltf')

    const rawProperties = await fetch('./result/properties.json');
    properties = await rawProperties.json();

	// Get spatial tree
	const tree = await constructSpatialTree();
	console.log(tree);
}

// Get properties of selected item
window.ondblclick = async () => {
	const result = await viewer.IFC.selector.pickIfcItem(true);
	const foundProperties = properties[result.id];
	getPropertySets(foundProperties);
	console.log(foundProperties);
};
window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();

// Utils functions
function getFirstItemOfType(type) {
	return Object.values(properties).find(item => item.type === type);
}

function getAllItemsOfType(type) {
	return Object.values(properties).filter(item => item.type === type);
}

// Get spatial tree
async function constructSpatialTree() {
	const ifcProject = getFirstItemOfType('IFCPROJECT');

	const ifcProjectNode = {
		expressID: ifcProject.expressID,
		type: 'IFCPROJECT',
		children: [],
	};

	const relContained = getAllItemsOfType('IFCRELAGGREGATES');
	const relSpatial = getAllItemsOfType('IFCRELCONTAINEDINSPATIALSTRUCTURE');

	await constructSpatialTreeNode(
		ifcProjectNode,
		relContained,
		relSpatial,
	);

	return ifcProjectNode;

}

// Recursively constructs the spatial tree
async function constructSpatialTreeNode(
	item,
	contains,
	spatials,
) {
	const spatialRels = spatials.filter(
		rel => rel.RelatingStructure === item.expressID,
	);
	const containsRels = contains.filter(
		rel => rel.RelatingObject === item.expressID,
	);

	const spatialRelsIDs = [];
	spatialRels.forEach(rel => spatialRelsIDs.push(...rel.RelatedElements));

	const containsRelsIDs = [];
	containsRels.forEach(rel => containsRelsIDs.push(...rel.RelatedObjects));

	const childrenIDs = [...spatialRelsIDs, ...containsRelsIDs];

	const children = [];
	for (let i = 0; i < childrenIDs.length; i++) {
		const childID = childrenIDs[i];
		const props = properties[childID];
		const child = {
			expressID: props.expressID,
			type: props.type,
			children: [],
		};

		await constructSpatialTreeNode(child, contains, spatials);
		children.push(child);
	}

	item.children = children;
}

// Gets the property sets

function getPropertySets(props) {
	const id = props.expressID;
	const propertyValues = Object.values(properties);
	const allPsetsRels = propertyValues.filter(item => item.type === 'IFCRELDEFINESBYPROPERTIES');
	const relatedPsetsRels = allPsetsRels.filter(item => item.RelatedObjects.includes(id));
	const psets = relatedPsetsRels.map(item => properties[item.RelatingPropertyDefinition]);
	for(let pset of psets) {
		pset.HasProperty = pset.HasProperties.map(id => properties[id]);
	}
	props.psets = psets;
}