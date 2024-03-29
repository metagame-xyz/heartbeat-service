// import CCapture from 'ccapture.js-npmfixed';
// import Chance from 'chance';
// import { GUI } from 'dat.gui';
// import { IPFS } from 'ipfs-core-types';
// import { useMemo } from 'react';
// import {
//     AxesHelper,
//     BoxGeometry,
//     BoxHelper,
//     Color,
//     DirectionalLight,
//     Event,
//     GridHelper,
//     Group,
//     IcosahedronGeometry,
//     Light,
//     LoadingManager,
//     Mesh,
//     MeshBasicMaterial,
//     Object3D,
//     PerspectiveCamera,
//     PMREMGenerator,
//     Scene,
//     sRGBEncoding,
//     Vector3,
//     WebGLRenderer,
// } from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// import '@utils/gif.worker';

// import { BlobMaterial } from './BlobMaterial';
// import { doneDivClass } from './constants';
// import { addBlobToIPFS, clickableIPFSLink, updateImage } from './frontend';
// import { createIPFSClient } from './frontend';
// import { generateColor, interpolators, lerpColor, toString } from './heartHelpers';
// import { Metadata } from './metadata';
// import { getParametersFromTxnCounts } from './parameters';

// const GIF_OPTIONS = {
//     name: 'demo-gif',
//     quality: 1,
//     fps: 60,
//     onExportProgress: (progress: number) => console.log(`GIF export progress: ${progress}.`),
//     onExportFinish: () => console.log(`Finished GIF export.`),
// };

// export default class HeartGrower {
//     el: HTMLElement;
//     scene: Scene;
//     camera: PerspectiveCamera;
//     renderer: WebGLRenderer;
//     controls: OrbitControls;
//     gui: GUI;
//     lights: Light[];

//     axesHelper: AxesHelper;
//     gridHelper: GridHelper;

//     state = {
//         // environment: environments[1].name,
//         // background: true,
//         //Lights
//         directionalIntensity: 4,
//         directionalColor: 0xd1d1d1,
//         //Helpers
//         grid: true,
//         axes: false,
//         boxes: false,
//     };
//     activeCamera: any;
//     pmremGenerator: any;

//     controlsDestination: Vector3;

//     heart: Object3D;
//     frameCount: number;

//     cube: Object3D;

//     capturer: any;
//     IPFSClient: IPFS;
//     eventForwardAuthToken: string;
//     tokenId: string;
//     startTime: number;

//     constructor(el: HTMLElement) {
//         this.el = el;
//         this.scene = new Scene();

//         this.camera = new PerspectiveCamera(10, el.clientWidth / el.clientHeight, 0.01, 1000);
//         this.scene.add(this.camera);
//         this.initLights();

//         this.renderer = new WebGLRenderer({ antialias: true });
//         this.renderer.outputEncoding = sRGBEncoding;
//         this.renderer.setClearColor(0xcccccc); // background clear is grey instead of black
//         this.renderer.setPixelRatio(window.devicePixelRatio);
//         this.renderer.setSize(el.clientWidth, el.clientHeight);

//         this.pmremGenerator = new PMREMGenerator(this.renderer);
//         this.pmremGenerator.compileEquirectangularShader();

//         this.controls = new OrbitControls(this.camera, this.renderer.domElement);

//         this.initControlsPosition();

//         this.el.appendChild(this.renderer.domElement);

//         this.frameCount = 0;

//         this.animate = this.animate.bind(this);
//         requestAnimationFrame(this.animate);
//     }

//     animate() {
//         this.renderer.render(this.scene, this.camera);
//         this.controls.update();

//         if (this.cube) {
//             this.cube.rotation.x += 0.02;
//             this.cube.rotation.y += 0.02;
//         }
//         const totalFrames = 120;

//         if (this.capturer) {
//             if (this.frameCount < totalFrames) {
//                 this.capturer.capture(this.renderer.domElement);
//                 // console.log('frame:', this.frameCount);
//             }
//             if (this.frameCount === totalFrames) {
//                 this.capturer.stop();
//                 this.capturer.save(async (blob: Blob) => {
//                     const url = await addBlobToIPFS(this.IPFSClient, blob);
//                     const secondsElapsed = (Date.now() - this.startTime) / 1000;
//                     const response = await updateImage(
//                         this.tokenId,
//                         url,
//                         this.eventForwardAuthToken,
//                         secondsElapsed,
//                     );
//                     console.log('url:', clickableIPFSLink(url));
//                     this.done();
//                 });
//             }
//             this.frameCount++;
//         }

//         requestAnimationFrame(this.animate.bind(this));
//     }

//     renderHeart(metadata: Metadata) {
//         const chance = new Chance(metadata.address);

//         const attributes = getParametersFromTxnCounts(metadata.txnCounts);

//         const [h, s, l] = generateColor(metadata.address);
//         const color = toString(attributes.contrast ? [h, s, l] : [h, 0, l]);
//         const colorContrast = lerpColor('#262626', '#f3f4f6', attributes.ethereumActivity);

//         const interpolatedAttributes = Object.keys(interpolators).reduce((acc, key) => {
//             acc[key] = interpolators[key](attributes[key]);
//             return acc;
//         }, {});

//         const amplitude = 1.15;
//         const frequency = 1.4;

//         const threeColor = new Color(color);
//         const threeColorContrast = new Color(colorContrast);

//         const mesh = new Mesh(new IcosahedronGeometry(1, 64), new BlobMaterial());

//         // const color = chance.color({ format: 'hex' });

//         console.log('color:', color);
//         const geometry = new BoxGeometry(1, 1, 1, 3, 3, 3);
//         const material = new MeshBasicMaterial({ color });
//         this.cube = new Mesh(geometry, material);
//         this.scene.add(this.cube);
//     }

//     // renderHeart() {
//     //     const geometry = new BoxGeometry();
//     //     const material = new MeshBasicMaterial({ color });
//     //     this.cube = new Mesh(geometry, material);
//     //     this.scene.add(this.cube);
//     //     // this.scene.add(this.heart);
//     // }

//     enableIPFSUpload(
//         projectId: string,
//         secret: string,
//         eventForwardAuthToken: string,
//         tokenId: string,
//         startTime: number,
//     ) {
//         this.IPFSClient = createIPFSClient(projectId, secret);
//         this.eventForwardAuthToken = eventForwardAuthToken;
//         this.tokenId = tokenId;
//         this.startTime = startTime;
//     }

//     startRecording() {
//         console.log('start recording');
//         this.capturer = new CCapture({
//             format: 'gif',
//             workersPath: '../gif.worker',
//             transparent: 0xcccccc,
//         });
//         this.capturer.start();
//     }

//     async wait() {
//         function sleep(ms) {
//             return new Promise((resolve) => setTimeout(resolve, ms));
//         }

//         await sleep(1);
//     }

//     done() {
//         // console.log(this.renderer.info.render);
//         const doneDiv = document.createElement('div');
//         this.el.appendChild(doneDiv);
//         doneDiv.classList.add(doneDivClass);
//     }

//     initControlsPosition() {
//         const intialPosition = new Vector3(0, 20, 40);
//         this.camera.position.set(intialPosition.x, intialPosition.y, intialPosition.z);

//         this.controls.enableDamping = true;
//         this.controls.dampingFactor = 0.1;

//         this.controls.enableZoom = false;
//         this.controls.enablePan = false;

//         // this.controlsDestination = new Vector3(0, 0, 0);
//         // this.controls.object.position.set(intialPosition.x, intialPosition.y, intialPosition.z);
//         // this.controls.target.set(-1, 3, 6);
//     }

//     initLights() {
//         this.lights = [];

//         const state = this.state;
//         const camPosition = this.camera.position;

//         const directionalLight = new DirectionalLight(
//             state.directionalColor,
//             state.directionalIntensity,
//         );
//         directionalLight.name = 'mainLight';
//         directionalLight.position.set(camPosition.x, camPosition.y, camPosition.z);
//         this.camera.add(directionalLight);
//         this.lights.push(directionalLight);
//     }

//     updateLights() {
//         const state = this.state;

//         this.lights.forEach((light: Light) => {
//             if (light.name === 'mainLight') {
//                 light.intensity = state.directionalIntensity;
//                 light.color.setHex(state.directionalColor);
//             }
//         });
//     }

//     getModel(modelName: string): Promise<Object3D<Event>> {
//         return new Promise((resolve, reject) => {
//             const loader = new GLTFLoader(new LoadingManager());

//             loader.load(
//                 `/${modelName}.glb`,
//                 (gltf) => {
//                     resolve(gltf.scene.children[0]);
//                 },
//                 undefined,
//                 reject,
//             );
//         });
//     }

//     initDevHelper() {
//         // console.log(this.usedColors);
//         this.updateAxesHelper();
//         this.updateGridHelper();
//         this.updateBoxesHelper();
//         this.addGUI();
//     }

//     updateAxesHelper() {
//         if (this.state.axes) {
//             this.axesHelper = new AxesHelper(5);
//             this.scene.add(this.axesHelper);
//         } else {
//             this.scene.remove(this.axesHelper);
//         }
//     }

//     updateGridHelper() {
//         if (this.state.grid) {
//             this.gridHelper = new GridHelper(144, 144);
//             this.scene.add(this.gridHelper);
//         } else {
//             this.scene.remove(this.gridHelper);
//         }
//     }

//     updateBoxesHelper() {
//         if (this.state.boxes) {
//             const objects = this.scene.children.filter((child) => child instanceof Mesh);
//             for (const object of objects) {
//                 this.scene.add(new BoxHelper(object, new Color(0xff0000)));
//             }
//         } else {
//             const boxes = this.scene.children.filter((child) => child instanceof BoxHelper);
//             for (const box of boxes) {
//                 this.scene.remove(box);
//             }
//         }
//     }

//     addGUI() {
//         this.gui = new GUI({ autoPlace: true, width: 260, hideable: true, name: 'Garden' });
//         const lightFolder = this.gui.addFolder('Lighting');
//         lightFolder.open();

//         const lightControls = [
//             lightFolder.add(this.state, 'directionalIntensity', 0, 10, 1),
//             lightFolder.addColor(this.state, 'directionalColor'),
//         ];

//         lightControls.forEach((ctrl) => ctrl.onChange(() => this.updateLights()));

//         const helperFolder = this.gui.addFolder('Helper');
//         helperFolder.open();

//         helperFolder.add(this.state, 'grid').onChange(() => this.updateGridHelper());
//         helperFolder.add(this.state, 'axes').onChange(() => this.updateAxesHelper());
//         helperFolder.add(this.state, 'boxes').onChange(() => this.updateBoxesHelper());

//         const guiDiv = document.createElement('div');
//         this.el.appendChild(guiDiv);
//         guiDiv.classList.add('gui');
//         guiDiv.id = 'gui';
//         guiDiv.appendChild(this.gui.domElement);
//         this.gui.open();
//     }

//     // updateEnvironment() {
//     //     console.log('environment:', environments);
//     //     const environment = environments.filter(
//     //         (entry) => entry.name === this.state.environment,
//     //     )[0];

//     //     this.getCubeMapTexture(environment).then(({ envMap }) => {
//     //         this.scene.environment = envMap;
//     //         this.scene.background = this.state.background ? envMap : null;
//     //     });
//     // }

//     // getCubeMapTexture(environment) {
//     //     const { path } = environment;

//     //     console.log('path:', path);
//     //     // no envmap
//     //     if (!path) return Promise.resolve({ envMap: null });

//     //     return new Promise((resolve, reject) => {
//     //         new RGBELoader().setDataType(UnsignedByteType).load(
//     //             '/environment/forest.hdr',
//     //             (texture) => {
//     //                 const envMap = this.pmremGenerator.fromCubemap(texture).texture;
//     //                 this.pmremGenerator.dispose();

//     //                 resolve({ envMap });
//     //             },
//     //             undefined,
//     //             reject,
//     //         );
//     //     });
//     // }
// }

export default null;
