import Chance from 'chance';
import { GUI } from 'dat.gui';
import {
    AxesHelper,
    Box3,
    Box3Helper,
    BoxHelper,
    Color,
    DirectionalLight,
    Event,
    GridHelper,
    Group,
    Light,
    LoadingManager,
    MathUtils,
    Mesh,
    MeshStandardMaterial,
    Object3D,
    PerspectiveCamera,
    PMREMGenerator,
    Scene,
    Sphere,
    SphereGeometry,
    sRGBEncoding,
    UnsignedByteType,
    Vector3,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import { environments } from '../public/environment/index.js';
import { doneDivClass } from './constants';
import { specialNfts } from './specialnfts2';
import {
    getRandomFlowerColor as getFlowerColor,
    getFlowerName,
    getRandomFlowerCoords,
    getSizeAndStem,
    getSpecialFlowerCoords,
} from './squarePlanting';

declare global {
    interface Window {
        model: Object3D<Event>;
    }
}

const randomFlowers = ['Amaryllis', 'Hydrangea', 'Periwinkle', 'Poppy'];
const specificFlowers = ['Hydrangea', 'Periwinkle', 'Poppy'];
const allFlowers = randomFlowers.concat(specificFlowers);

const oneColor = ['magenta'];
const metagameFlowerColors = ['cyan', 'purple', 'greenyellow'];
const standardFlowerColors = ['deepblue', 'magenta', 'peach', 'pink', 'yellowgreen']; // lightblue
const randomFlowerColors = metagameFlowerColors.concat(standardFlowerColors);
const domFlowerColors = ['red'];
const allFlowerColors = randomFlowerColors.concat(domFlowerColors);
type Coords = [number, number, number];

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

    flowers: Group;
    ground: Group;
    usedColors: Record<string, number>;

    coordinates: String[][];

    randomFlowerCount: number;
    specialFlowerCount: number;
    modelsToLoad: Object3D[];

    targetViewGroup: Group;

    state = {
        environment: environments[1].name,
        background: true,
        //Lights
        directionalIntensity: 4,
        directionalColor: 0xd1d1d1,
        //Helpers
        grid: true,
        axes: false,
        boxes: false,
    };
    activeCamera: any;
    pmremGenerator: any;
    grass: any;
    pebbles: any;

    constructor(el: HTMLElement) {
        this.el = el;
        this.scene = new Scene();

        this.camera = new PerspectiveCamera(10, el.clientWidth / el.clientHeight, 0.01, 1000);
        this.scene.add(this.camera);
        this.initLights();

        this.renderer = new WebGLRenderer({ antialias: true });
        this.renderer.outputEncoding = sRGBEncoding;
        this.renderer.setClearColor(0xcccccc); // background clear is grey instead of black
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(el.clientWidth, el.clientHeight);

        this.pmremGenerator = new PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this;

        this.controls.addEventListener('change', (event) => {
            const pos = this.controls.object.position;
            const target = this.controls.target;
            console.log(`Position: ${Math.round(pos.x)} ${Math.round(pos.y)} ${Math.round(pos.z)}`);
            console.log(
                `Target: ${Math.round(target.x)} ${Math.round(target.y)} ${Math.round(target.z)}`,
            );
        });

        this.initControlsPosition();

        this.el.appendChild(this.renderer.domElement);

        this.flowers = new Group();
        this.ground = new Group();
        this.grass = new Group();
        this.pebbles = new Group();
        this.targetViewGroup = new Group();

        this.usedColors = {};

        this.coordinates = [];
        this.randomFlowerCount = 0;
        this.specialFlowerCount = 0;
        this.modelsToLoad = [];

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    initControlsPosition() {
        this.controls.object.position.set(-1, 76, -124);
        this.controls.target.set(-1, 3, 6);
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

    positionCamera() {
        const angle = 30;
        // console.log(this.flowers);
        const bbox = new Box3().setFromObject(this.flowers);
        // this.scene.add(new Box3Helper(bbox, new Color(0xff0000)));
        // console.log(bbox);

        const center = new Vector3();
        bbox.getCenter(center);
        center.x = 0;
        // console.log('center:', center);

        const bsphere = bbox.getBoundingSphere(new Sphere());
        // console.log(bsphere);

        // let m = new MeshStandardMaterial({
        //     color: 0xffffff,
        //     opacity: 0.3,
        //     transparent: true,
        // });
        // var geometry = new SphereGeometry(bsphere.radius, 32, 32);
        // let sMesh = new Mesh(geometry, m);
        // this.scene.add(sMesh);
        // sMesh.position.copy(center);
        this.controls.target = center;

        const vFoV = this.camera.getEffectiveFOV();
        const hFoV = this.camera.fov * this.camera.aspect;
        const halfFovInRadians = MathUtils.degToRad(hFoV) / 2;
        const distance = (bsphere.radius / Math.sin(halfFovInRadians)) * 0.9;

        const rad = MathUtils.degToRad(angle);
        const z = Math.cos(rad) * (center.z - distance);
        const y = Math.sin(rad) * (center.y + distance);

        this.controls.object.position.set(center.x, y, z);
    }

    async addGround(str) {
        const ground = await this.getModel(`ground/${str}`);
        ground.name = 'ground';
        // ground.receiveShadow = true;
        ground.position.set(0, 0, 0);
        const scale = 1;
        ground.scale.set(scale, scale, scale);
        // this.modelsToLoad.push(ground);
        // this.scene.add(ground);

        const width = 1;
        const front = 4;
        const back = -1;

        for (let i = -width; i <= width; i++) {
            for (let j = back; j <= front; j++) {
                const size = 18.9;
                const clone = ground.clone();
                clone.position.set(i * size, 0, j * size);
                this.ground.add(clone);
            }
        }
    }

    async addGrass() {
        const grass = await this.getModel(`ground/grass_individual`);
        grass.name = 'grass';
        // grass.receiveShadow = true;
        grass.position.set(0, 0, 0);
        const scale = 1;
        grass.scale.set(scale, scale, scale);
        // this.modelsToLoad.push(grass);
        // this.scene.add(grass);

        const width = 10;
        const front = 20;
        const back = 1;

        for (let i = -width; i <= width; i++) {
            for (let j = back; j <= front; j++) {
                const size = 0.5;
                const clone = grass.clone();
                clone.position.set(i * size, 0, j * size);
                this.grass.add(clone);
            }
        }
    }

    async addPebbles() {
        const grass = await this.getModel(`ground/pebble`);
        grass.name = 'grass';
        // grass.receiveShadow = true;
        grass.position.set(0, 0, 0);
        const scale = 1;
        grass.scale.set(scale, scale, scale);
        // this.modelsToLoad.push(grass);
        // this.scene.add(grass);

        const width = 10;
        const height = 10;
        const front = 20;
        const back = 1;

        for (let i = 0; i < 100; i++) {
            const clone = grass.clone();
            clone.position.set(width * Math.random(), Math.random() * 0.2, height * Math.random());
            clone.rotateX(Math.random() * 360);
            clone.rotateY(Math.random() * 360);
            clone.rotateZ(Math.random() * 360);
            this.pebbles.add(clone);
        }
    }

    async showFlowerExamples(color = 'magenta') {
        let model;
        let modelString;
        let coords: Coords;

        type Nft = {
            name: string;
            color: string;
            position: number[];
            sizeAndStem?: string[];
            flowerName?: string;
        };

        for (const [key, nft] of Object.entries(specialNfts as Record<string, Nft>)) {
            console.log('special nft:', nft.name);
            const flowerName = nft.flowerName || 'Hydrangea';
            const color = nft.color || 'red';
            const [size, stem] = nft.sizeAndStem || ['OG', 'long'];
            modelString = `flowers/${flowerName}/${size}/${stem}/${flowerName}_${size}_${stem}_${color}`;
            coords = getSpecialFlowerCoords(nft.position as [number, number]);
            console.log('special nft coords:', coords);
            model = await this.getFlower(modelString);

            model.position.set(...coords);
            this.flowers.add(model);
        }

        // this.specialFlowerCount++;
        // const order = [
        //     // ['baby/short', 'baby_short'],
        //     ['OG/normal', 'OG_normal'],
        //     ['bush/short', 'bush_short'],
        //     ['bush/normal', 'bush_normal'],
        //     // ['bush/long', 'bush_long'],
        // ];
        // const flowers = [
        //     //     'Amaryllis',
        //     // 'Periwinkle',
        //     // 'Poppy',
        //     'Hydrangea',
        //     // 'Cannalilly',
        // ];
        // for (let i = 0; i < flowers.length; i++) {
        //     for (let j = 0; j < order.length; j++) {
        //         for (let m = 0; m < allFlowerColors.length; m++) {
        //             // const modelString = `flowers/${flowers[i]}/${order[j][0]}/${flowers[i]}_${order[j][1]}_${allFlowerColors[m]}`;
        //             const modelString = `flowers/${flowers[i]}/${order[j][0]}/${flowers[i]}_${order[j][1]}_red`;
        //             const model = await this.getFlower(modelString);
        //             model.position.set(i * 20 + m * 2, 0, j * 3);
        //             this.scene.add(model);
        //         }
        //     }
        // }
    }

    async growFlowerInSquare(contractAddress: string, nftCount: number, minterAddress: string) {
        let model;
        let modelString;
        let coords: Coords;

        const nft = specialNfts[contractAddress];

        if (nft) {
            console.log('special nft:', nft.name);
            const flowerName = nft.flowerName || 'Hydrangea';
            const color = nft.color;
            const [size, stem] = nft.sizeAndStem;
            modelString = `flowers/${flowerName}/${size}/${stem}/${flowerName}_${size}_${stem}_${color}`;
            coords = getSpecialFlowerCoords(nft.position);
            // this.specialFlowerCount++;
        } else {
            const flowerName = getFlowerName(this.randomFlowerCount, nftCount);
            const color = getFlowerColor(minterAddress, nftCount);
            const [size, stem] = getSizeAndStem(nftCount);
            modelString = `flowers/${flowerName}/${size}/${stem}/${flowerName}_${size}_${stem}_${color}`;
            coords = getRandomFlowerCoords(this.randomFlowerCount, flowerName);

            this.randomFlowerCount++;
        }

        // only 132 randomly placed flower spots
        if (this.randomFlowerCount <= 132 || nft) {
            model = await this.getFlower(modelString, minterAddress);

            model.position.set(...coords);
            this.flowers.add(model);
        }
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

    async getFlower(modelString: string, minterAddress = ''): Promise<Object3D<Event>> {
        // console.log(modelString);
        let model;

        if (this.flowers[modelString]) {
            model = this.flowers[modelString].clone();
        } else {
            model = await this.getModel(modelString);
            this.flowers[modelString] = model;
        }

        const chance = new Chance(minterAddress);
        const random = chance.floating({ min: -1, max: 1 });
        model.rotateY(random * 2 + 180);
        return model;
    }

    renderAllFlowers() {
        this.scene.add(this.flowers);
    }

    renderGround() {
        this.scene.add(this.ground);
    }

    renderGrass() {
        this.scene.add(this.grass);
    }

    renderPebbles() {
        this.scene.add(this.pebbles);
    }

    renderAllModels() {
        this.renderGround();
        this.renderAllFlowers();
        // this.updateEnvironment();
    }

    done() {
        // console.log(this.renderer.info.render);
        const doneDiv = document.createElement('div');
        this.el.appendChild(doneDiv);
        doneDiv.classList.add(doneDivClass);
    }

    initDevHelper() {
        // console.log(this.usedColors);
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
            this.gridHelper = new GridHelper(144, 144);
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

    // updateEnvironment() {
    //     console.log('environment:', environments);
    //     const environment = environments.filter(
    //         (entry) => entry.name === this.state.environment,
    //     )[0];

    //     this.getCubeMapTexture(environment).then(({ envMap }) => {
    //         this.scene.environment = envMap;
    //         this.scene.background = this.state.background ? envMap : null;
    //     });
    // }

    // getCubeMapTexture(environment) {
    //     const { path } = environment;

    //     console.log('path:', path);
    //     // no envmap
    //     if (!path) return Promise.resolve({ envMap: null });

    //     return new Promise((resolve, reject) => {
    //         new RGBELoader().setDataType(UnsignedByteType).load(
    //             '/environment/forest.hdr',
    //             (texture) => {
    //                 const envMap = this.pmremGenerator.fromCubemap(texture).texture;
    //                 this.pmremGenerator.dispose();

    //                 resolve({ envMap });
    //             },
    //             undefined,
    //             reject,
    //         );
    //     });
    // }
}
