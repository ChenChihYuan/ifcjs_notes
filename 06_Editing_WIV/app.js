import { Color, Scene } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import {IFCBUILDINGSTOREY} from "web-ifc";

const container = document.getElementById('viewer-container');  
const viewer = new IfcViewerAPI({container, backgroundColor: new Color(0xffffff)});
const scene = viewer.context.getScene();

viewer.axes.setAxes();

viewer.grid.setGrid();

let model;
const loader = new IFCLoader();

const input = document.getElementById('file-input');
input.addEventListener('change', async () => {
    const file = input.files[0];
    const url = URL.createObjectURL(file);
    model = await loader.loadAsync(url);
    scene.add(model);
    await editfloorName()
})

async function editfloorName(event) {
    const storeysIds = await loader.ifcManager.getAllItemsOfType(model.modelID, IFCBUILDINGSTOREY, false);
    const firstStoreyId = storeysIds[0];
    const storey = await loader.ifcManager.getItemProperties(model.modelID, firstStoreyId);
    console.log(storey);

    const result = prompt("New name for your storey");
    storey.LongName.value = result;
    loader.ifcManager.ifcAPI.WriteLine(model.modelID, storey)

    const data = await loader.ifcManager.ifcAPI.ExportFileAsIFC(model.modelID);
    const blob = new Blob([data]);
    const file = new File([blob], 'new_file.ifc');
    const link = document.createElement('a');
    link.download = 'new_file.ifc';
    link.href = URL.createObjectURL(file);
    document.body.appendChild(link);
    link.click();
    link.remove();
}
