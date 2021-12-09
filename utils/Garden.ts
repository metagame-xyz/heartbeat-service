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

const hydrangeaColors = [
    'cyan',
    'deepblue',
    'greenyellow',
    'lightblue',
    'magenta',
    'peach',
    'pink',
    'purple',
    'red',
    'yellowpink',
];

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

    flowers: Record<string, Object3D>;
    usedColors: Record<string, number>;

    state = {
        //Lights
        directionalIntensity: 4,
        directionalColor: 0xd1d1d1,
        //Helpers
        grid: true,
        axes: false,
        boxes: false,
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

        this.flowers = {};
        this.usedColors = {};

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

    getModelFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<Object3D<Event>> {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader(new LoadingManager());

            loader.parse(
                arrayBuffer,
                '',
                (gltf) => {
                    resolve(gltf.scene.children[0]);
                },
                reject,
            );
        });
    }

    async getFlower(modelString: string): Promise<Object3D<Event>> {
        console.log(modelString);
        let model;

        if (this.flowers[modelString]) {
            model = this.flowers[modelString].clone();
        } else {
            model = await this.getModel(modelString);
            this.flowers[modelString] = model;
        }

        return model;
    }

    async showFlowerExamples(color = 'peach') {
        const stems = ['short', 'normal', 'long'];
        const sizes = ['baby', 'OG', 'bush'];
        for (let i = 0; i < stems.length; i++) {
            for (let j = 0; j < sizes.length; j++) {
                if (i === 0 && (j === 0 || j === 2)) {
                    console.log('skipping');
                } else {
                    const modelString = `Hydrangea/${sizes[j]}/${stems[i]}/Hydrangea_${sizes[j]}_${stems[i]}_${color}`;
                    console.log(`${stems[i]} ${sizes[j]}`);
                    const model = await this.getFlower(modelString);
                    model.position.set(i * 2, 0, j * 2);

                    this.scene.add(model);
                }
            }
        }
    }
    async growFlower({ symbol, count, creator = null }: NFTdata) {
        // console.log('growFlower', symbol, count, creator);

        const getFlowerSize = (count) => {
            const base = 1;
            switch (count) {
                case 1:
                    return base;
                case 2:
                    return base * 1.2;
                default:
                    return base * 1.5;
            }
        };

        const getFlowerColor = (symbol: string, colorOptions: string[]) => {
            // sum char codes of symbol, pseudo-randomly pick a color
            const charCodeTotal = symbol.split('').reduce((a, char) => a + char.charCodeAt(0), 0);
            const colorIndex = charCodeTotal % colorOptions.length;

            // saving number of each flower color, maybe for metadata
            if (this.usedColors[colorOptions[colorIndex]]) {
                this.usedColors[colorOptions[colorIndex]] += 1;
            } else {
                this.usedColors[colorOptions[colorIndex]] = 1;
            }

            return colorOptions[colorIndex];
        };

        const getFlowerName = (symbol: string) => {
            return 'Hydrangea';
        };

        const getStemWord = (count) => {
            if (count <= 3) {
                return 'normal'; // TODO update correct stem word
            } else if (count >= 12) {
                return 'long';
            } else {
                return 'normal';
            }
        };

        const getSizeWord = (count) => {
            switch (count) {
                case 1:
                    return 'baby';
                case 2:
                    console.log('2', count);
                    return 'OG';
                default:
                    return 'bush';
            }
        };

        const getRandomPosition = (): [number, number, number] => {
            const max = 6;
            const min = max * -1;
            const x = Math.floor(Math.random() * (max - min + 1)) + min;
            const z = Math.floor(Math.random() * (max - min + 1)) + min;
            // console.log('x', x, 'z', z);
            return [x, 0, z];
        };

        const getSpecificPosition = (symbol: string): [number, number, number] | null => {
            const specialNFTMapping = {
                BBLOCK: [0, 0, 0],
                LOOT: [1, 0, 1],
                'The Proof of Attendance Protocol': [-1, 0, -1],
                BLIT: [1, 0, -1],
                CORRUPT: [-1, 0, 1],
                NAUT: [2, 0, 2],
            };
            return specialNFTMapping[symbol];
        };

        const getPosition = (symbol: string): [number, number, number] => {
            return getSpecificPosition(symbol) || getRandomPosition();
        };

        const color = getFlowerColor(symbol, hydrangeaColors);
        const name = getFlowerName(symbol);
        const stem = getStemWord(count);
        const size = getSizeWord(count);

        let modelString = `${name}/${size}/${stem}/${name}_${size}_${stem}_${color}`;

        console.log('count', count, '', modelString);
        let model;

        if (this.flowers[modelString]) {
            model = this.flowers[modelString].clone();
        } else {
            model = await this.getModel(modelString);
            this.flowers[modelString] = model;
        }

        // set scale
        // const scaleFactor = getFlowerSize(count);
        // model.scale.setScalar(scaleFactor); //0.1

        // set position
        model.position.set(...getPosition(symbol));

        this.scene.add(model);
        window.model = model;
    }

    initDevHelper() {
        console.log(this.usedColors);
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
