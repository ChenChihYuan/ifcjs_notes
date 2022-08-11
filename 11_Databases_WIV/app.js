import { Color, Line } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import {Dexie} from 'dexie';
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
import { IfcPlane } from "web-ifc-viewer/dist/components/display/clipping-planes/planes";

const container = document.getElementById('viewer-container');  
const viewer = new IfcViewerAPI({container, backgroundColor: new Color(0xffffff)});
viewer.axes.setAxes();
viewer.grid.setGrid();
// viewer.IFC.loadIfcUrl('./02.ifc'); 
// Load('./02.ifc');

// Get all the buttons
const saveButton = document.getElementById('save-button');
const loadButton = document.getElementById('load-button');
const removeButton = document.getElementById('remove-button');
const input = document.getElementById('file-input');

// Set up the button logic

removeButton.onclick = () => removeDatabase();
loadButton.onclick = () => loadSaveModel();
saveButton.onclick = () => input.click();
input.onchange = () => preprocessAndSaveModel();

// set up what buttons the user can click

updateButton();

function updateButton(){
	const modelsNames = localStorage.getItem('modelsNames');
	
	if(!modelsNames){
		loadButton.classList.add('disabled');
		removeButton.classList.add('disabled');
		saveButton.classList.remove('disabled');
		
	}
	else{
		loadButton.classList.remove('disabled');
		removeButton.classList.remove('disabled');
		saveButton.classList.add('disabled');
		
	}
}

// Create a database

const db = CreateOrOpenDatabase();

function CreateOrOpenDatabase(){

	const db = new Dexie("ModelDatabase")
	db.version(1).stores({
		bimModels: `
		name,
		id,
		categpry,
		level
		`});
	
		return db;
}


async function preprocessAndSaveModel(){
	const file = input.files[0];
	const url = URL.createObjectURL(file);

	const result = await viewer.GLTF.exportIfcFileAsGltf({
		ifcFileUrl: url,
		splitByFloors: true,
		categories: {
			walls: [IFCWALL, IFCWALLSTANDARDCASE],
			slabs: [IFCSLAB],
			windows: [IFCWINDOW],
			curtainwalls: [IFCCURTAINWALL, IFCPLATE, IFCCURTAINWALL],
			doors: [IFCDOOR],
		}
	})

	const models = []
	for(const categortName in result.gltf){
		const category = result.gltf[categortName];
		for(const levelName in category){
			const file = category[levelName].file;
			if(file){

				const data = await file.arrayBuffer(); // serialize the file to an array buffer

				models.push({
					name: result.id + categortName + levelName,
					id: result.id,
					category: categortName,
					level: levelName,
					file: data
				})
			}
		}
	}

	// store all the models in the database
	await db.bimModels.bulkPut(models);

	const names = models.map(model=> model.name);
	const serializedNames = JSON.stringify(names);
	localStorage.setItem("modelsNames", serializedNames);
	location.reload();
}


async function loadSaveModel(){
	const serializedNames = localStorage.getItem("modelsNames");
	const names = JSON.parse(serializedNames);
	for(const name of names){
		const savedModel = await db.bimModels.where("name").equals(name).toArray();

		const data = savedModel[0].file;
		const file = new File([data], 'example');
		const url = URL.createObjectURL(file);
		await viewer.GLTF.loadModel(url);
	}

	loadButton.classList.add('disabled');
}

function removeDatabase(){
	localStorage.removeItem("modelsNames");
	db.delete();
	location.reload();
}