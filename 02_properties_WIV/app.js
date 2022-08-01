import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

const container = document.getElementById('viewer-container');  
const viewer = new IfcViewerAPI({container, backgroundColor: new Color(0xffffff)});
viewer.axes.setAxes();
viewer.grid.setGrid();
// viewer.IFC.loadIfcUrl('./02.ifc'); // load ifc file from url
Load();

async function Load(){
    const model = await viewer.IFC.loadIfcUrl('./02.ifc'); 

    await viewer.shadowDropper.renderShadow(model.modelID)
    viewer.context.renderer.postProduction.active = true;
}

// window.ondblclick = () => viewer.IFC.selector.pickIfcItem();

window.ondblclick = async () => {
    const result = await viewer.IFC.selector.highlightIfcItem();
    if (!result) return;
    const { modelID, id } = result;
    const props = await viewer.IFC.getProperties(modelID, id, true, false);
    console.log(props);
};


window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();