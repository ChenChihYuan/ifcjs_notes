import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

const container = document.getElementById('viewer-container');  
const viewer = new IfcViewerAPI({container, backgroundColor: new Color(0xffffff)});
viewer.axes.setAxes();
viewer.grid.setGrid();
// viewer.IFC.loadIfcUrl('./02.ifc'); // load ifc file from url
Load();

let model;

async function Load(){
    model = await viewer.IFC.loadIfcUrl('./01.ifc'); 

    await viewer.shadowDropper.renderShadow(model.modelID)
    viewer.context.renderer.postProduction.active = true;

    // const project = viewer.IFC.getSpatialStructure(model.modelID);
    const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
    console.log(ifcProject);
    createTreeMenu(ifcProject)
}

function createTreeMenu(ifcProject) {
    const root = document.getElementById("tree-root");
    removeAllChildren(root);
    const ifcProjectNode = createNestedChild(root, ifcProject);
    ifcProject.children.forEach(child => {
        constructTreeMenuNode(ifcProjectNode, child);
    })
    console.log(ifcProject.children);
}

function constructTreeMenuNode(parent, node){
    const children = node.children;
    if(children.length === 0){
        createSimpleChild(parent, node);
        return;
    }
    const nodeElement = createNestedChild(parent, node);
    children.forEach(child => {
        constructTreeMenuNode(nodeElement, child);
    })
}

function createSimpleChild(parent, node){
    const content = nodeToString(node);
    const childNode = document.createElement("li");
    childNode.classList.add("leaf-node");
    childNode.textContent = content;
    parent.appendChild(childNode);

    childNode.onmouseenter = () => {
        viewer.IFC.selector.prepickIfcItemsByID(model.modelID, [node.expressID]);
    }
}


function createNestedChild(parent, node){
    const content = nodeToString(node);
    const root = document.createElement("li");
    createTitle(root, content);
    const childrenContainer = document.createElement("ul");
    childrenContainer.classList.add("nested");
    root.appendChild(childrenContainer);
    parent.appendChild(root)
    return childrenContainer;
}

function createTitle(parent, content){  
    const title = document.createElement("span");
    title.classList.add("caret");
    title.onclick = () => {
        title.parentElement.querySelector('.nested').classList.toggle('active');
        title.classList.toggle("caret-down");
    }
    title.textContent = content;
    parent.appendChild(title);
}


function nodeToString(node){
    return `${node.type} - ${node.expressID}`;
}


function removeAllChildren(element){
    while(element.firstChild){
        element.removeChild(element.firstChild);
    }
}


const toggler = document.getElementsByClassName("caret");
let i;

for (i = 0; i < toggler.length; i++) {
  toggler[i].addEventListener("click", function() {
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.classList.toggle("caret-down");
  });
}
