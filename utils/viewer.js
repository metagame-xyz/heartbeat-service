import { GUI } from 'dat.gui';
import {
    AmbientLight,
    AnimationMixer,
    Box3,
    Cache,
    DirectionalLight,
    HemisphereLight,
    LinearEncoding,
    LoaderUtils,
    LoadingManager,
    PerspectiveCamera,
    PMREMGenerator,
    REVISION,
    Scene,
    sRGBEncoding,
    UnsignedByteType,
    Vector3,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import { environments } from './environment/index.js';
import { createBackground } from './lib/three-vignette.js';

// import { createCanvas } from 'node-canvas-webgl';

const DEFAULT_CAMERA = '[default]';

const MANAGER = new LoadingManager();
const THREE_PATH = `https://unpkg.com/three@0.${REVISION}.x`;
const DRACO_LOADER = new DRACOLoader(MANAGER).setDecoderPath(
    `${THREE_PATH}/examples/js/libs/draco/gltf/`,
);
const KTX2_LOADER = new KTX2Loader(MANAGER).setTranscoderPath(
    `${THREE_PATH}/examples/js/libs/basis/`,
);

const Preset = { ASSET_GENERATOR: 'assetgenerator' };

Cache.enabled = true;

export class Viewer {
    constructor(el, options) {
        this.el = el;
        this.options = options;

        this.lights = [];
        this.content = null;
        this.mixer = null;
        this.clips = [];
        this.gui = null;

        this.state = {
            environment:
                options.preset === Preset.ASSET_GENERATOR
                    ? environments.find((e) => e.id === 'footprint-court').name
                    : environments[1].name,
            background: true,
            playbackSpeed: 1.0,
            actionStates: {},
            camera: DEFAULT_CAMERA,

            // Lights
            addLights: true,
            exposure: 1.0,
            textureEncoding: 'sRGB',
            ambientIntensity: 0.3,
            ambientColor: 0xffffff,
            directIntensity: 0.8 * Math.PI, // TODO(#116)
            directColor: 0xffffff,
            bgColor1: '#ffffff',
            bgColor2: '#353535',
        };

        this.prevTime = 0;

        this.scene = new Scene();

        const fov = options.preset === Preset.ASSET_GENERATOR ? (0.8 * 180) / Math.PI : 60;
        this.defaultCamera = new PerspectiveCamera(
            fov,
            el.clientWidth / el.clientHeight,
            0.01,
            1000,
        );
        this.activeCamera = this.defaultCamera;
        this.scene.add(this.defaultCamera);

        // const canvas = createCanvas(el.clientWidth, el.clientHeight);

        this.renderer = window.renderer = new WebGLRenderer({ antialias: true });
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = sRGBEncoding;
        this.renderer.setClearColor(0xcccccc);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(el.clientWidth, el.clientHeight);

        this.pmremGenerator = new PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();

        this.controls = new OrbitControls(this.defaultCamera, this.renderer.domElement);
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = -10;
        this.controls.screenSpacePanning = true;

        this.vignette = createBackground({
            aspect: this.defaultCamera.aspect,
            grainScale: 0.001,
            colors: [this.state.bgColor1, this.state.bgColor2],
        });
        this.vignette.name = 'Vignette';
        this.vignette.renderOrder = -1;

        this.el.appendChild(this.renderer.domElement);

        this.cameraCtrl = null;
        this.cameraFolder = null;

        this.addGUI();
        if (options.kiosk) this.gui.close();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
        window.addEventListener('resize', this.resize.bind(this), false);
    }

    animate(time) {
        requestAnimationFrame(this.animate);

        const dt = (time - this.prevTime) / 1000;

        this.controls.update();
        this.mixer && this.mixer.update(dt);
        this.render();

        this.prevTime = time;
    }

    render() {
        this.renderer.render(this.scene, this.activeCamera);
    }

    resize() {
        console.log('resize', this.el.parentElement);
        const { clientHeight, clientWidth } = this.el.parentElement;

        this.defaultCamera.aspect = clientWidth / clientHeight;
        this.defaultCamera.updateProjectionMatrix();
        this.vignette.style({ aspect: this.defaultCamera.aspect });
        this.renderer.setSize(clientWidth, clientHeight);
    }

    load(modelName, rootPath, assetMap) {
        const baseURL = LoaderUtils.extractUrlBase(modelName);

        // Load.
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader(MANAGER)
                .setCrossOrigin('anonymous')
                .setDRACOLoader(DRACO_LOADER)
                .setKTX2Loader(KTX2_LOADER.detectSupport(this.renderer))
                .setMeshoptDecoder(MeshoptDecoder);

            loader.load(
                `/${modelName}.glb`,
                (gltf) => {
                    const scene = gltf.scene || gltf.scenes[0];
                    const clips = gltf.animations || [];

                    if (!scene) {
                        // Valid, but not supported by this viewer.
                        throw new Error(
                            'This model contains no scene, and cannot be viewed here. However,' +
                                ' it may contain individual 3D resources.',
                        );
                    }
                    this.setContent(scene, clips);
                    resolve(gltf);
                },
                undefined,
                reject,
            );
        });
    }

    /**
     * @param {THREE.Object3D} object
     * @param {Array<THREE.AnimationClip} clips
     */
    setContent(object, clips) {
        this.clear();

        const box = new Box3().setFromObject(object);
        const size = box.getSize(new Vector3()).length();
        const center = box.getCenter(new Vector3());

        this.controls.reset();

        object.position.x += object.position.x - center.x;
        object.position.y += object.position.y - center.y;
        object.position.z += object.position.z - center.z;
        this.controls.maxDistance = size * 10;
        this.defaultCamera.near = size / 100;
        this.defaultCamera.far = size * 100;
        this.defaultCamera.updateProjectionMatrix();

        if (this.options.cameraPosition) {
            this.defaultCamera.position.fromArray(this.options.cameraPosition);
            this.defaultCamera.lookAt(new Vector3());
        } else {
            this.defaultCamera.position.copy(center);
            this.defaultCamera.position.x += size / 2.0;
            this.defaultCamera.position.y += size / 5.0;
            this.defaultCamera.position.z += size / 2.0;
            this.defaultCamera.lookAt(center);
        }

        this.setCamera(DEFAULT_CAMERA);

        this.controls.saveState();

        this.scene.add(object);
        this.content = object;

        this.state.addLights = true;

        this.content.traverse((node) => {
            if (node.isLight) {
                this.state.addLights = false;
            } else if (node.isMesh) {
                // TODO(https://github.com/mrdoob/three.js/pull/18235): Clean up.
                node.material.depthWrite = !node.material.transparent;
            }
        });

        this.setClips(clips);

        this.updateLights();
        this.updateGUI();
        this.updateEnvironment();
        this.updateTextureEncoding();

        window.content = this.content;
        // console.info('[glTF Viewer] THREE.Scene exported as `window.content`.');
        // this.printGraph(this.content);
    }

    printGraph(node) {
        console.group(' <' + node.type + '> ' + node.name);
        node.children.forEach((child) => this.printGraph(child));
        console.groupEnd();
    }

    /**
     * @param {Array<THREE.AnimationClip} clips
     */
    setClips(clips) {
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.mixer.getRoot());
            this.mixer = null;
        }

        this.clips = clips;
        if (!clips.length) return;

        this.mixer = new AnimationMixer(this.content);
    }

    playAllClips() {
        this.clips.forEach((clip) => {
            this.mixer.clipAction(clip).reset().play();
            this.state.actionStates[clip.name] = true;
        });
    }

    /**
     * @param {string} name
     */
    setCamera(name) {
        if (name === DEFAULT_CAMERA) {
            this.controls.enabled = true;
            this.activeCamera = this.defaultCamera;
        } else {
            this.controls.enabled = false;
            this.content.traverse((node) => {
                if (node.isCamera && node.name === name) {
                    this.activeCamera = node;
                }
            });
        }
    }

    updateTextureEncoding() {
        const encoding = this.state.textureEncoding === 'sRGB' ? sRGBEncoding : LinearEncoding;
        traverseMaterials(this.content, (material) => {
            if (material.map) material.map.encoding = encoding;
            if (material.emissiveMap) material.emissiveMap.encoding = encoding;
            if (material.map || material.emissiveMap) material.needsUpdate = true;
        });
    }

    updateLights() {
        const state = this.state;
        const lights = this.lights;

        if (state.addLights && !lights.length) {
            this.addLights();
        } else if (!state.addLights && lights.length) {
            this.removeLights();
        }

        this.renderer.toneMappingExposure = state.exposure;

        if (lights.length === 2) {
            lights[0].intensity = state.ambientIntensity;
            lights[0].color.setHex(state.ambientColor);
            lights[1].intensity = state.directIntensity;
            lights[1].color.setHex(state.directColor);
        }
    }

    addLights() {
        const state = this.state;

        if (this.options.preset === Preset.ASSET_GENERATOR) {
            const hemiLight = new HemisphereLight();
            hemiLight.name = 'hemi_light';
            this.scene.add(hemiLight);
            this.lights.push(hemiLight);
            return;
        }

        const light1 = new AmbientLight(state.ambientColor, state.ambientIntensity);
        light1.name = 'ambient_light';
        this.defaultCamera.add(light1);

        const light2 = new DirectionalLight(state.directColor, state.directIntensity);
        light2.position.set(0.5, 0, 0.866); // ~60º
        light2.name = 'main_light';
        this.defaultCamera.add(light2);

        this.lights.push(light1, light2);
    }

    removeLights() {
        this.lights.forEach((light) => light.parent.remove(light));
        this.lights.length = 0;
    }

    updateEnvironment() {
        const environment = environments.filter(
            (entry) => entry.name === this.state.environment,
        )[0];

        this.getCubeMapTexture(environment).then(({ envMap }) => {
            if ((!envMap || !this.state.background) && this.activeCamera === this.defaultCamera) {
                this.scene.add(this.vignette);
            } else {
                this.scene.remove(this.vignette);
            }

            this.scene.environment = envMap;
            this.scene.background = this.state.background ? envMap : null;
        });
    }

    getCubeMapTexture(environment) {
        const { path } = environment;

        // no envmap
        if (!path) return Promise.resolve({ envMap: null });

        return new Promise((resolve, reject) => {
            new RGBELoader().setDataType(UnsignedByteType).load(
                path,
                (texture) => {
                    const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
                    this.pmremGenerator.dispose();

                    resolve({ envMap });
                },
                undefined,
                reject,
            );
        });
    }

    updateBackground() {
        this.vignette.style({ colors: [this.state.bgColor1, this.state.bgColor2] });
    }

    addGUI() {
        const gui = (this.gui = new GUI({ autoPlace: false, width: 260, hideable: true }));

        // Display controls.
        const dispFolder = gui.addFolder('Display');
        dispFolder.add(this.controls, 'autoRotate');
        dispFolder.add(this.controls, 'screenSpacePanning');
        const bgColor1Ctrl = dispFolder.addColor(this.state, 'bgColor1');
        const bgColor2Ctrl = dispFolder.addColor(this.state, 'bgColor2');
        bgColor1Ctrl.onChange(() => this.updateBackground());
        bgColor2Ctrl.onChange(() => this.updateBackground());

        // Lighting controls.
        const lightFolder = gui.addFolder('Lighting');
        const encodingCtrl = lightFolder.add(this.state, 'textureEncoding', ['sRGB', 'Linear']);
        encodingCtrl.onChange(() => this.updateTextureEncoding());
        lightFolder
            .add(this.renderer, 'outputEncoding', { sRGB: sRGBEncoding, Linear: LinearEncoding })
            .onChange(() => {
                this.renderer.outputEncoding = Number(this.renderer.outputEncoding);
                traverseMaterials(this.content, (material) => {
                    material.needsUpdate = true;
                });
            });
        const envMapCtrl = lightFolder.add(
            this.state,
            'environment',
            environments.map((env) => env.name),
        );
        envMapCtrl.onChange(() => this.updateEnvironment());
        [
            lightFolder.add(this.state, 'exposure', 0, 2),
            lightFolder.add(this.state, 'addLights').listen(),
            lightFolder.add(this.state, 'ambientIntensity', 0, 2),
            lightFolder.addColor(this.state, 'ambientColor'),
            lightFolder.add(this.state, 'directIntensity', 0, 4), // TODO(#116)
            lightFolder.addColor(this.state, 'directColor'),
        ].forEach((ctrl) => ctrl.onChange(() => this.updateLights()));

        // Camera controls.
        this.cameraFolder = gui.addFolder('Cameras');
        this.cameraFolder.domElement.style.display = 'none';

        const guiWrap = document.createElement('div');
        this.el.appendChild(guiWrap);
        guiWrap.classList.add('gui-wrap');
        guiWrap.appendChild(gui.domElement);
        gui.open();
    }

    updateGUI() {
        this.cameraFolder.domElement.style.display = 'none';

        const cameraNames = [];
        this.content.traverse((node) => {
            if (node.isCamera) {
                node.name = node.name || `VIEWER__camera_${cameraNames.length + 1}`;
                cameraNames.push(node.name);
            }
        });

        if (cameraNames.length) {
            this.cameraFolder.domElement.style.display = '';
            if (this.cameraCtrl) this.cameraCtrl.remove();
            const cameraOptions = [DEFAULT_CAMERA].concat(cameraNames);
            this.cameraCtrl = this.cameraFolder.add(this.state, 'camera', cameraOptions);
            this.cameraCtrl.onChange((name) => this.setCamera(name));
        }
    }

    clear() {
        if (!this.content) return;

        this.scene.remove(this.content);

        // dispose geometry
        this.content.traverse((node) => {
            if (!node.isMesh) return;

            node.geometry.dispose();
        });

        // glTF texture types. `envMap` is deliberately omitted, as it's used internally
        // by the loader but not part of the glTF format.
        const MAP_NAMES = [
            'map',
            'aoMap',
            'emissiveMap',
            'glossinessMap',
            'metalnessMap',
            'normalMap',
            'roughnessMap',
            'specularMap',
        ];

        // dispose textures
        traverseMaterials(this.content, (material) => {
            MAP_NAMES.forEach((map) => {
                if (material[map]) material[map].dispose();
            });
        });
    }
}

function traverseMaterials(object, callback) {
    object.traverse((node) => {
        if (!node.isMesh) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach(callback);
    });
}
