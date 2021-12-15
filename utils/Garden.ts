import Chance from 'chance';
import { GUI } from 'dat.gui';
import {
    AxesHelper,
    BoxHelper,
    Color,
    DirectionalLight,
    Event,
    GridHelper,
    Light,
    LoadingManager,
    Mesh,
    Object3D,
    PerspectiveCamera,
    Scene,
    sRGBEncoding,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { specialNfts } from './specialnfts2';

declare global {
    interface Window {
        model: Object3D<Event>;
    }
}

const randomFlowers = ['Amaryllis', 'Hydrangea', 'Periwinkle', 'Poppy'];
const specificFlowers = ['Hydrangea', 'Periwinkle', 'Poppy'];
const allFlowers = randomFlowers.concat(specificFlowers);

const metagameFlowerColors = ['cyan', 'purple', 'greenyellow'];
const standardFlowerColors = ['deepblue', 'lightblue', 'magenta', 'peach', 'pink', 'yellowgreen'];
const randomFlowerColors = metagameFlowerColors.concat(standardFlowerColors);
const domFlowerColors = ['red'];
const allFlowerColors = randomFlowerColors.concat(domFlowerColors);
type Coords = [number, number, number];

const getRandom = (contractAddress: string, options: string[]) => {
    // sum char codes of symbol, pseudo-randomly pick a color
    const charCodeTotal = contractAddress.split('').reduce((a, char) => a + char.charCodeAt(0), 0);
    const index = charCodeTotal % options.length;
    return options[index];
};

const getSizeAndStem = (count: number): [string, string] => {
    switch (count) {
        case 1:
            return ['baby', 'short'];
        case 2:
            return ['OG', 'normal'];
        case 3:
            return ['bush', 'short'];
        case 4:
            return ['bush', 'normal'];
        default:
            return ['bush', 'long'];
    }
};

function getRandomPosition(contractAddress: string, tracking): Coords {
    const max = 10;
    const min = -1 * max;

    const chanceX = new Chance(contractAddress);
    const chanceZ = new Chance(contractAddress.split('').reverse().join(''));

    const x = chanceX.floating({ min: min, max: max });
    const z = chanceZ.floating({ min: min, max: max });
    tracking.push([x, z]);

    return [x, 0, z];
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

    flowers: Record<string, Object3D>;
    usedColors: Record<string, number>;

    coordinates: String[][];

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

        this.coordinates = [];

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
        guiDiv.id = 'gui';
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

    async addGround(number) {
        const ground = await this.getModel(`ground/ground1`);
        ground.name = 'ground';
        // ground.receiveShadow = true;
        ground.position.set(0, 0, 0);
        const scale = 0.01;
        ground.scale.set(scale, scale, scale);
        this.scene.add(ground);
    }

    async showFlowerExamples(color = 'magenta') {
        const order = [
            ['baby/short', 'baby_short'],
            ['OG/normal', 'OG_normal'],
            ['bush/short', 'bush_short'],
            ['bush/normal', 'bush_normal'],
            ['bush/long', 'bush_long'],
        ];
        const flowers = [
            'Amaryllis',
            'Periwinkle',
            'Poppy',
            'Hydrangea',
            // 'Cannalilly',
        ];
        for (let i = 0; i < flowers.length; i++) {
            for (let j = 0; j < order.length; j++) {
                for (let m = 0; m < randomFlowerColors.length; m++) {
                    const modelString = `flowers/${flowers[i]}/${order[j][0]}/${flowers[i]}_${order[j][1]}_${randomFlowerColors[m]}`;
                    const model = await this.getFlower(modelString);
                    model.position.set(i * 20 + m * 2, 0, j * 3);
                    this.scene.add(model);
                }
            }
        }
        // const sizes = ['baby', 'OG', 'bush'];
        // const stems = ['short', 'normal', 'long'];
        // for (let i = 0; i < flowers.length; i++) {
        //     for (let m = 0; m < randomFlowerColors.length; m++) {
        //         for (let j = 0; j < sizes.length; j++) {
        //             for (let k = 0; k < stems.length; k++) {
        //                 const modelString = `flowers/${flowers[i]}/${sizes[j]}/${stems[k]}/${flowers[i]}_${sizes[j]}_${stems[k]}_${randomFlowerColors[m]}`;
        //                 console.log(` ${stems[i]} ${sizes[j]}`);
        //                 const model = await this.getFlower(modelString);
        //                 model.position.set(i * 20 + m * 2, 0, j * 6 + k * 2);
        //                 this.scene.add(model);
        //             }
        //         }
        //     }
        // }
        // Cannalilly only
        // const flowers = ['Cannalilly'];
        // const sizes = ['OG'];
        // const stems = ['short', 'normal', 'long'];
        // for (let i = 0; i < flowers.length; i++) {
        //     for (let m = 0; m < randomFlowerColors.length; m++) {
        //         for (let j = 0; j < sizes.length; j++) {
        //             for (let k = 0; k < stems.length; k++) {
        //                 const modelString = `flowers/${flowers[i]}/${sizes[j]}/${stems[k]}/${flowers[i]}_${sizes[j]}_${stems[k]}_${randomFlowerColors[m]}`;
        //                 console.log(` ${stems[i]} ${sizes[j]}`);
        //                 const model = await this.getFlower(modelString);
        //                 model.position.set(i * 20 + m * 2, 0, j * 6 + k * 2);
        //                 this.scene.add(model);
        //             }
        //         }
        //     }
        // }
    }
    async growFlower(contractAddress: string, count: number) {
        // console.log('growFlower', symbol, count, creator);

        const nft = specialNfts[contractAddress];

        const flowerName = nft?.flowerName || getRandom(contractAddress, randomFlowers);
        const color = nft?.color || getRandom(contractAddress, randomFlowerColors);
        const [size, stem] = nft?.sizeAndStem || getSizeAndStem(count);

        // console.log('nft:', nft?.name);
        // console.log(`flowerName: ${flowerName}_${size}_${stem}_${color}`);

        let modelString = `flowers/${flowerName}/${size}/${stem}/${flowerName}_${size}_${stem}_${color}`;

        let model;

        if (this.flowers[modelString]) {
            model = this.flowers[modelString].clone();
        } else {
            model = await this.getModel(modelString);
            this.flowers[modelString] = model;
        }

        const position = nft?.position || getRandomPosition(contractAddress, this.coordinates);
        // const position =
        //     nft?.position || getPosition(flowerName, color) || getRandomPosition('demo');

        model.position.set(...position);

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
