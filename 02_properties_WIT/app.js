import {
    AmbientLight,
    AxesHelper,
    DirectionalLight,
    GridHelper,
    Loader,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    Raycaster,
    Vector2,
    MeshLambertMaterial
  } from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import {IFCLoader}  from "web-ifc-three"
  import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";
  import { IFCSLAB } from "web-ifc";
  
  //Creates the Three.js scene
  const scene = new Scene();
  
  //Object to store the size of the viewport
  const size = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  
  //Creates the camera (point of view of the user)
  const camera = new PerspectiveCamera(75, size.width / size.height);
  camera.position.z = 15;
  camera.position.y = 13;
  camera.position.x = 8;
  
  //Creates the lights of the scene
  const lightColor = 0xffffff;
  
  const ambientLight = new AmbientLight(lightColor, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new DirectionalLight(lightColor, 2);
  directionalLight.position.set(0, 10, 0);
  scene.add(directionalLight);
  
  //Sets up the renderer, fetching the canvas of the HTML
  const threeCanvas = document.getElementById("three-canvas");
  const renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true });
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  //Creates grids and axes in the scene
  const grid = new GridHelper(50, 30);
  scene.add(grid);
  
  const axes = new AxesHelper();
  axes.material.depthTest = false;
  axes.renderOrder = 1;
  scene.add(axes);
  
  //Creates the orbit controls (to navigate the scene)
  const controls = new OrbitControls(camera, threeCanvas);
  controls.enableDamping = true;
  controls.target.set(-2, 0, 0);
  
  //Animation loop
  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  
  animate();
  
  //Adjust the viewport to the size of the browser
  window.addEventListener("resize", () => {
    (size.width = window.innerWidth), (size.height = window.innerHeight);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
  
  });



 

  const ifcModels = [];

  // IFC loading
  const ifcLoader = new IFCLoader();
  
  const input = document.getElementById('file-input')
  input.addEventListener('change', async () => {
    console.log('file selected')
    const file = input.files[0];
    const url = URL.createObjectURL(file);
    const model = await ifcLoader.loadAsync(url);
    scene.add(model);
    ifcModels.push(model);
    logAllSlabs()
  });

  ifcLoader.ifcManager.setupThreeMeshBVH(computeBoundsTree, disposeBoundsTree, acceleratedRaycast);

  const raycaster = new Raycaster();
  raycaster.firstHitOnly = true;
  const mouse = new Vector2();

  function cast(event) {

    // Computes the position of the mouse on the screen
    const bounds = threeCanvas.getBoundingClientRect();

    const x1 = event.clientX - bounds.left;
    const x2 = bounds.right - bounds.left;
    mouse.x = (x1 / x2) * 2 - 1;

    const y1 = event.clientY - bounds.top;
    const y2 = bounds.bottom - bounds.top;
    mouse.y = -(y1 / y2) * 2 + 1;

    // Places it on the camera pointing to the mouse
    raycaster.setFromCamera(mouse, camera);

    // Casts a ray
    return raycaster.intersectObjects(ifcModels);
  }

  const highlightMaterial = new MeshLambertMaterial({
      color: 0xff77ff,
      opacity: 0.5,
      transparent: true,
      depthWrite: false,
    });
    
  let lastModel;

  async function pick(event) {
    const found = cast(event)[0];
    if (!found) 
      return;

    const index = found.faceIndex;
    const geometry = found.object.geometry;
    const ifc = ifcLoader.ifcManager;
    const id = ifc.getExpressId(geometry, index);

    // getItemProperties to get properties
    const props = await ifcLoader.ifcManager.getItemProperties(found.object.modelID, id);
    console.log(props);

    ifcLoader.ifcManager.createSubset({
      modelID: found.object.modelID,
      ids: [id],
      material: highlightMaterial,
      scene,
      removePrevious: false,
   })

   if(lastModel){
    ifcLoader.ifcManager.removeSubset(lastModel.modelID, highlightMaterial);
    lastModel = undefined;

   }
  }

  
  const modelID = 0;

  async function logAllSlabs(){
    const slabsID = await ifcLoader.ifcManager.getAllItemsOfType(modelID, IFCSLAB);

    for(let i = 0; i < slabsID.length; i++) {
        const slabID = slabsID[i];
        const slabProperties = await ifcLoader.ifcManager.getItemProperties(0, slabID);
        console.log(slabProperties);
    }
  }

  // window.ondblclick = logAllSlabs()
  

  window.ondblclick = pick;

  