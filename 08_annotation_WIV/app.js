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

    viewer.dimensions.active = true;
    viewer.dimensions.previewActive = true;
    
    window.ondblclick= () => {
        viewer.dimensions.create();
    }
    window.onkeydown= (e) => {
        if(e.code === 'Delete'){
            viewer.dimensions.delete();
        }
    }

}

