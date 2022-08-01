import { Color, Scene } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { IFCLoader } from 'web-ifc-three/IFCLoader';

const container = document.getElementById('viewer-container');  
const viewer = new IfcViewerAPI({container, backgroundColor: new Color(0xffffff)});
const scene = viewer.context.getScene();

viewer.axes.setAxes();

viewer.grid.setGrid();

const loader = new IFCLoader();

loader.ifcManager.useWebWorkers(true, "./IFCWorker.js");

const input = document.getElementById('file-input');
input.addEventListener('change', async () => {
    const file = input.files[0];
    const url = URL.createObjectURL(file);
    const model = await loader.loadAsync(url);
    scene.add(model);
})

setupProgress();

function setupProgress(){
    const text = document.getElementById('progress-text');
    loader.ifcManager.setOnProgress((event) => {
        const percent = event.loaded / event.total * 100;
        const formatted = `${Math.trunc(percent)}%`;
        text.innerText = formatted;
    })
}