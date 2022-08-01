import { Color } from "three";
import { IfcComponent, IfcViewerAPI } from "web-ifc-viewer";
import {
    IFCWALLSTANDARDCASE,
    IFCSLAB,
    IFCFURNISHINGELEMENT,
    IFCDOOR,
    IFCWINDOW,
    IFCPLATE,
    IFCMEMBER
} from 'web-ifc';


const container = document.getElementById('viewer-container');  
const viewer = new IfcViewerAPI({container, backgroundColor: new Color(0xffffff)});
viewer.axes.setAxes();
viewer.grid.setGrid();

const scene = viewer.context.getScene()


// viewer.IFC.loadIfcUrl('./02.ifc'); // load ifc file from url
Load();
let model;

const pickable = viewer.context.items.pickableIfcModels;

async function Load(){
    model = await viewer.IFC.loadIfcUrl('./01.ifc'); 
    model.removeFromParent();
    togglePickable(model, false);    

    await viewer.shadowDropper.renderShadow(model.modelID)
    viewer.context.renderer.postProduction.active = true;
    // viewer.context.renderer.postProduction.update();

    await setupAllCategories()
}

const categories = {
    IFCWALLSTANDARDCASE,
    IFCSLAB,
    IFCFURNISHINGELEMENT,
    IFCDOOR,
    IFCWINDOW,
    IFCPLATE,
    IFCMEMBER
}

function getName(category){
    const names = Object.keys(categories);
    return names.find(name => categories[name] === category);
}

async function getAll(category){
    return viewer.IFC.loader.ifcManager.getAllItemsOfType(0, category, false);
}

async function newSubsetOfType(category){
    const ids = await getAll(category);
    return viewer.IFC.loader.ifcManager.createSubset({
        modelID: 0,
        scene,
        ids,
        removePrevious: true,
        customID: category.toString()
    });
}


const subsets = {}

async function setupAllCategories(){
    const allCategories = Object.values(categories);
    for(const category of allCategories){
       await setupCategory(category);
    }
}

async function setupCategory(category){
    const subset = await newSubsetOfType(category);
    subset.userData.categories = category.toString()
    subsets[category] = subset;
    togglePickable(subset, true);
    setupCheckBox(category);
}

function setupCheckBox(category) {
	const name = getName(category);
	const checkBox = document.getElementById(name);
    checkBox.addEventListener('change', (event) => {
        const subset = subsets[category];
        const checked = event.target.checked;
        console.log(subset)
        if(checked){
            scene.add(subset);
            togglePickable(subset, true);
        }
        else{
            subset.removeFromParent();
            togglePickable(subset, false);
        }

        viewer.context.renderer.postProduction.update();
    });
}

window.ondblclick = () => {
    const result = viewer.context.castRayIfc()
    console.log(result)
    if(result===null) return;
    
    const index =result.faceIndex;
    const subset = result.object;
    const id = viewer.IFC.loader.ifcManager.getExpressId(subset.geometry,index);
    console.log('subset.modelID: ', subset.modelID)
    console.log('id: ', id)
    
    viewer.IFC.loader.ifcManager.removeFromSubset(
        subset.modelID,
        [id]
    )

}

window.onmousemove = () => {
    viewer.IFC.selector.prePickIfcItem();

}


function togglePickable(mesh, isPickable){
    const pickableModels = viewer.context.items.pickableIfcModels;
    if(isPickable){
        pickableModels.push(mesh);
    }
    else{
        const index = pickableModels.indexOf(mesh);
        pickableModels.splice(index, 1);
    }
}