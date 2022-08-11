import {Camera, Scene, DirectionalLight, Vector3, Matrix4,WebGLRenderer, GLTFLoader} from 'three';
// TO MAKE THE MAP APPEAR YOU MUST
// ADD YOUR ACCESS TOKEN FROM
// https://account.mapbox.com

import { IFCLoader } from 'web-ifc-three';


const coordinates = [139.703569429021,35.620646126603575 ];

mapboxgl.accessToken = 'pk.eyJ1IjoiamltbXljaGVuNyIsImEiOiJjbDZvazBmbm4wNGMzM2NvZGFvb3JydGRwIn0.-3xKC-S5GrJIjleWkyN_OA';
const map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/mapbox/light-v10',
zoom: 18,
center: coordinates,
pitch: 60,
antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
});
 
// parameters to ensure the model is georeferenced correctly on the map
const modelOrigin = coordinates;
const modelAltitude = 0;
const modelRotate = [Math.PI / 2, 0, 0];
 
const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
modelOrigin,
modelAltitude
);
 
// transformation parameters to position, rotate and scale the 3D model onto the map
const modelTransform = {
translateX: modelAsMercatorCoordinate.x,
translateY: modelAsMercatorCoordinate.y,
translateZ: modelAsMercatorCoordinate.z,
rotateX: modelRotate[0],
rotateY: modelRotate[1],
rotateZ: modelRotate[2],
/* Since the 3D model is in real world meters, a scale transform needs to be
* applied since the CustomLayerInterface expects units in MercatorCoordinates.
*/
scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
};
 

 
// configuration of the custom layer for a 3D model per the CustomLayerInterface
const customLayer = {
id: '3d-model',
type: 'custom',
renderingMode: '3d',
onAdd: function (map, gl) {
this.camera = new Camera();
this.scene = new Scene();

// load bim model

loadModel(this.scene);
 
// create two three.js lights to illuminate the model
const directionalLight = new DirectionalLight(0xffffff);
directionalLight.position.set(0, -70, 100).normalize();
this.scene.add(directionalLight);
 
const directionalLight2 = new DirectionalLight(0xffffff);
directionalLight2.position.set(0, 70, 100).normalize();
this.scene.add(directionalLight2);
 


this.map = map;
 
// use the Mapbox GL JS map canvas for three.js
this.renderer = new WebGLRenderer({
canvas: map.getCanvas(),
context: gl,
antialias: true
});
 
this.renderer.autoClear = false;
},
render: function (gl, matrix) {
const rotationX = new Matrix4().makeRotationAxis(
new Vector3(1, 0, 0),
modelTransform.rotateX
);
const rotationY = new Matrix4().makeRotationAxis(
new Vector3(0, 1, 0),
modelTransform.rotateY
);
const rotationZ = new Matrix4().makeRotationAxis(
new Vector3(0, 0, 1),
modelTransform.rotateZ
);
 
const m = new Matrix4().fromArray(matrix);
const l = new Matrix4()
.makeTranslation(
modelTransform.translateX,
modelTransform.translateY,
modelTransform.translateZ
)
.scale(
new Vector3(
modelTransform.scale,
-modelTransform.scale,
modelTransform.scale
)
)
.multiply(rotationX)
.multiply(rotationY)
.multiply(rotationZ);
 
this.camera.projectionMatrix = m.multiply(l);
this.renderer.resetState();
this.renderer.render(this.scene, this.camera);
this.map.triggerRepaint();
}
};
 
map.on('style.load', () => {
map.addLayer(customLayer, 'waterway-label');
});

map.on('load', () => {
  // Insert the layer beneath any symbol layer.
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
  (layer) => layer.type === 'symbol' && layer.layout['text-field']
  ).id;
   
  // The 'building' layer in the Mapbox Streets
  // vector tileset contains building height data
  // from OpenStreetMap.
  map.addLayer(
  {
  'id': 'add-3d-buildings',
  'source': 'composite',
  'source-layer': 'building',
  'filter': ['==', 'extrude', 'true'],
  'type': 'fill-extrusion',
  'minzoom': 15,
  'paint': {
  'fill-extrusion-color': '#aaa',
   
  // Use an 'interpolate' expression to
  // add a smooth transition effect to
  // the buildings as the user zooms in.
  'fill-extrusion-height': [
  'interpolate',
  ['linear'],
  ['zoom'],
  15,
  0,
  15.05,
  ['get', 'height']
  ],
  'fill-extrusion-base': [
  'interpolate',
  ['linear'],
  ['zoom'],
  15,
  0,
  15.05,
  ['get', 'min_height']
  ],
  'fill-extrusion-opacity': 0.6
  }
  },
  labelLayerId
  );
  });

  async function loadModel(scene) {
    const loader = new IFCLoader();
    const model = await loader.loadAsync('04.ifc');
    scene.add(model);
  }

