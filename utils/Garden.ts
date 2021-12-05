import { t } from '@chakra-ui/styled-system/dist/declarations/src/utils';
import { GUI } from 'dat.gui';
import { Children } from 'react';
import {
    AmbientLight,
    AxesHelper,
    Box3,
    Box3Helper,
    BoxGeometry,
    BoxHelper,
    Cache,
    Color,
    DirectionalLight,
    Event,
    GridHelper,
    Group,
    Light,
    LoadingManager,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PerspectiveCamera,
    Scene,
    sRGBEncoding,
    Vector3,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { NFTdata } from '@utils/frontend';

declare global {
    interface Window {
        model: Object3D<Event>;
    }
}

export default class GardenGrower {
    el: HTMLElement;
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    controls: OrbitControls;
    gui: GUI;
    lights: Light[];

    axesHelper: AxesHelper;
    gridHelper: GridHelper;

    state = {
        //Lights
        directionalIntensity: 4,
        directionalColor: 0xd1d1d1,
        //Helpers
        grid: true,
        axes: true,
        boxes: true,
    };

    constructor(el: HTMLElement) {
        this.el = el;
        this.scene = new Scene();

        this.camera = new PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.01, 1000);
        this.scene.add(this.camera);
        this.positionCamera();
        this.initLights();

        this.renderer = new WebGLRenderer({ antialias: true });
        this.renderer.outputEncoding = sRGBEncoding;
        this.renderer.setClearColor(0xcccccc); // background clear is grey instead of black
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(el.clientWidth, el.clientHeight);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.el.appendChild(this.renderer.domElement);

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    positionCamera() {
        this.camera.position.x = 4;
        this.camera.position.y = 18;
        this.camera.position.z = 12;
        this.camera.lookAt(0, 1, 0);
    }
    initLights() {
        this.lights = [];

        const state = this.state;
        const camPosition = this.camera.position;

        const directionalLight = new DirectionalLight(
            state.directionalColor,
            state.directionalIntensity,
        );
        directionalLight.name = 'mainLight';
        directionalLight.position.set(camPosition.x, camPosition.y, camPosition.z);
        this.camera.add(directionalLight);
        this.lights.push(directionalLight);
    }

    updateLights() {
        const state = this.state;

        this.lights.forEach((light: Light) => {
            if (light.name === 'mainLight') {
                light.intensity = state.directionalIntensity;
                light.color.setHex(state.directionalColor);
            }
        });
    }

    addGUI() {
        this.gui = new GUI({ autoPlace: true, width: 260, hideable: true, name: 'Garden' });
        const lightFolder = this.gui.addFolder('Lighting');
        lightFolder.open();

        const lightControls = [
            lightFolder.add(this.state, 'directionalIntensity', 0, 10, 1),
            lightFolder.addColor(this.state, 'directionalColor'),
        ];

        lightControls.forEach((ctrl) => ctrl.onChange(() => this.updateLights()));

        const helperFolder = this.gui.addFolder('Helper');
        helperFolder.open();

        helperFolder.add(this.state, 'grid').onChange(() => this.updateGridHelper());
        helperFolder.add(this.state, 'axes').onChange(() => this.updateAxesHelper());
        helperFolder.add(this.state, 'boxes').onChange(() => this.updateBoxesHelper());

        const guiDiv = document.createElement('div');
        this.el.appendChild(guiDiv);
        guiDiv.classList.add('gui');
        guiDiv.appendChild(this.gui.domElement);
        this.gui.open();
    }

    getModel(modelName: string): Promise<Object3D<Event>> {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader(new LoadingManager());

            loader.load(
                `/${modelName}.glb`,
                (gltf) => {
                    resolve(gltf.scene.children[0]);
                },
                undefined,
                reject,
            );
        });
    }

    async growFlower({ symbol, count, creator = null }: NFTdata, modleName: string) {
        // console.log('growFlower', symbol, count, creator);

        const getFlowerSize = (count) => {
            switch (count) {
                case 1:
                    return 0.1;
                case 2:
                    return 0.12;
                default:
                    return 0.15;
            }
        };

        const max = 6;
        const min = max * -1;

        const x = Math.floor(Math.random() * (max - min + 1)) + min;
        const z = Math.floor(Math.random() * (max - min + 1)) + min;
        // console.log('x', x, 'z', z);

        const scaleFactor = getFlowerSize(count);

        let size;
        let center;
        function getCenter(model: Object3D<Event>) {
            const box = new Box3().setFromObject(model);
            return box.getCenter(new Vector3());
        }

        function getSize(model: Object3D<Event>) {
            const box = new Box3().setFromObject(model);
            return box.getSize(new Vector3());
        }

        const model = await this.getModel(modleName);

        // size = getSize(model);
        // console.log(`size of ${modleName} before:`, size);

        model.scale.setScalar(scaleFactor); //0.1

        // size = getSize(model);
        // console.log(`size of ${modleName} after:`, size);

        model.position.set(x, 0, z);

        this.scene.add(model);
        window.model = model;
    }

    initDevHelper() {
        this.updateAxesHelper();
        this.updateGridHelper();
        this.updateBoxesHelper();
        this.addGUI();
    }

    updateAxesHelper() {
        if (this.state.axes) {
            this.axesHelper = new AxesHelper(5);
            this.scene.add(this.axesHelper);
        } else {
            this.scene.remove(this.axesHelper);
        }
    }

    updateGridHelper() {
        if (this.state.grid) {
            this.gridHelper = new GridHelper(48, 48);
            this.scene.add(this.gridHelper);
        } else {
            this.scene.remove(this.gridHelper);
        }
    }

    updateBoxesHelper() {
        if (this.state.boxes) {
            const objects = this.scene.children.filter((child) => child instanceof Mesh);
            for (const object of objects) {
                this.scene.add(new BoxHelper(object, new Color(0xff0000)));
            }
        } else {
            const boxes = this.scene.children.filter((child) => child instanceof BoxHelper);
            for (const box of boxes) {
                this.scene.remove(box);
            }
        }
    }
}
