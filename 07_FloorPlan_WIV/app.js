import { Color, MeshBasicMaterial,LineBasicMaterial } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import Drawing from "dxf-writer";
import { damp } from "three/src/math/MathUtils";

const container = document.getElementById('viewer-container');  
const viewer = new IfcViewerAPI({container, backgroundColor: new Color(0xffffff)});
viewer.axes.setAxes();
viewer.grid.setGrid();
// viewer.IFC.loadIfcUrl('./02.ifc'); // load ifc file from url
Load();

let model;
let allPlans;

async function Load(){
    model = await viewer.IFC.loadIfcUrl('./02.ifc'); 

    await viewer.shadowDropper.renderShadow(model.modelID)
    toggleShadow();
    
    await viewer.plans.computeAllPlanViews(model.modelID);

    const lineMaterial = new LineBasicMaterial({color: 'black'});
    const baseMaterial = new MeshBasicMaterial({
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });

    viewer.edges.create('example-edges', model.modelID, lineMaterial, baseMaterial);

    const btn_container = document.getElementById('button-container');
    allPlans = viewer.plans.getAll(model.modelID);

    viewer.dxf.initializeJSDXF(Drawing)

    for(const plan of allPlans){
        const currentPlan = viewer.plans.planLists[model.modelID][plan];
        console.log(currentPlan);

        const button = document.createElement('button');
        btn_container.appendChild(button);
        button.textContent = currentPlan.name;
        button.onclick = () => {
            viewer.plans.goTo(model.modelID, plan)
            viewer.edges.toggle('example-edges', true);
            togglePostproduction(false);
        }
    }

    const button = document.createElement('button');
    btn_container.appendChild(button);
    button.textContent = 'Exit floorplans';
    button.onclick = () => {
        viewer.plans.exitPlanView();
        viewer.edges.toggle('example-edges', false);
        togglePostproduction(true);
    }

    await setupFloorplans()
    // floor plan export
    // setupFloorplans();

    const project = await viewer.IFC.getSpatialStructure( model.modelID);

    const storeys = project.children[0].children[0].children;
    for(const storey of storeys){
        for(const child of storey.children){
            if(child.children.length){
                storey.children.push(...child.children);
            }
        }
    }

    console.log("plans count: ", viewer.plans.planLists[model.modelID].length);

    for (const plan of allPlans) {
		const currentPlan = viewer.plans.planLists[model.modelID][plan];
		console.log(currentPlan);

		const button = document.createElement('button');
		btn_container.appendChild(button);
		button.textContent = 'Export ' + currentPlan.name;
		button.onclick = () => {
			const storey = storeys.find(storey => storey.expressID === currentPlan.expressID);
			drawProjectedItems(storey, currentPlan, model.modelID);
		};
	}
}

function toggleShadow(active){
    const shadows = Object.values(viewer.shadowDropper.shadows);
    for(const shadow of shadows){
        shadow.root.visible = active;
    }
}


function togglePostproduction(){
    viewer.context.renderer.postProduction.active = true;
}

const dummySubsetMaterial = new MeshBasicMaterial({visible: false});

async function drawProjectedItems(storey, plan, modelID) {

	// Create a new drawing (if it doesn't exist)
	if (!viewer.dxf.drawings[plan.name]) viewer.dxf.newDrawing(plan.name);

	// Get the IDs of all the items to draw
	const ids = storey.children.map(item => item.expressID);

	// If no items to draw in this layer in this floor plan, let's continue
	if (!ids.length) return;

	// If there are items, extract its geometry
	const subset = viewer.IFC.loader.ifcManager.createSubset({
		modelID,
		ids,
		removePrevious: true,
		customID: 'floor_plan_generation',
		material: dummySubsetMaterial,
	});

	// Get the projection of the items in this floor plan
	const filteredPoints = [];
	const edges = await viewer.edgesProjector.projectEdges(subset);
	const positions = edges.geometry.attributes.position.array;

	// Lines shorter than this won't be rendered
	const tolerance = 0.01;
	for (let i = 0; i < positions.length - 5; i += 6) {

		const a = positions[i] - positions[i + 3];
		// Z coords are multiplied by -1 to match DXF Y coordinate
		const b = -positions[i + 2] + positions[i + 5];

		const distance = Math.sqrt(a * a + b * b);

		if (distance > tolerance) {
			filteredPoints.push([positions[i], -positions[i + 2], positions[i + 3], -positions[i + 5]]);
		}

	}

	// Draw the projection of the items
	viewer.dxf.drawEdges(plan.name, filteredPoints, 'Projection', Drawing.ACI.BLUE, 'CONTINUOUS');

	// Clean up
	edges.geometry.dispose();


	// Draw all sectioned items
		viewer.dxf.drawNamedLayer(plan.name, plan, 'thick', 'Section', Drawing.ACI.RED, 'CONTINUOUS');
		viewer.dxf.drawNamedLayer(plan.name, plan, 'thin', 'Section_Secondary', Drawing.ACI.CYAN, 'CONTINUOUS');

	const result = viewer.dxf.exportDXF(plan.name);
	const link = document.createElement('a');
	link.download = 'floorplan.dxf';
	link.href = URL.createObjectURL(result);
	document.body.appendChild(link);
	link.click();
	link.remove();
}



async function setupFloorplans(){
    const project = await viewer.IFC.getSpatialStructure( model.modelID);

    const storeys = project.children[0].children[0].children;
    for(const storey of storeys){
        for(const child of storey.children){
            if(child.children.length){
                storey.children.push(...child.children);
            }
        }
    }

    console.log("plans count: ", viewer.plans.planLists[model.modelID].length);

    for (const plan of allPlans) {
		const currentPlan = viewer.plans.planLists[model.modelID][plan];
		console.log(currentPlan);

		const button = document.createElement('button');
		container.appendChild(button);
		button.textContent = 'Export ' + currentPlan.name;
		button.onclick = () => {
			const storey = storeys.find(storey => storey.expressID === currentPlan.expressID);
			drawProjectedItems(storey, currentPlan, model.modelID);
		};
	}
}