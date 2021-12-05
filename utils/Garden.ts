import { GUI } from 'dat.gui';
import {
    AmbientLight,
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

export default class GardenGrower {
    el: HTMLElement;
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    controls: OrbitControls;

    constructor(el: HTMLElement) {
        this.el = el;
        this.scene = new Scene();

        this.camera = new PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.01, 1000);
        this.scene.add(this.camera);

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

    async growFlower({ symbol, count, creator = null }: NFTdata, position: number) {
        // console.log('growFlower', symbol, count, creator);

        // const geometry = new BoxGeometry();
        // const material = new MeshBasicMaterial({ color: 0x00ff00 });
        // const cube = new Mesh(geometry, material);

        // const cubeBox = new Box3().setFromObject(cube);
        // const cubSize = cubeBox.getSize(new Vector3()).length();
        // console.log('cubeSize', cubSize);

        // this.scene.add(cube);
        // console.log(cube.getWorldPosition(new Vector3()));
        // console.log('cube.position', cube.position);

        // this.camera.position.z = 5;

        const model = await this.getModel('Hydrangea2');

        model.scale.set(0.01, 0.01, 0.01);
        model.position.set(position, 0, position);

        const box = new Box3().setFromObject(model);
        const helper = new Box3Helper(box, new Color(0xff0000)); // red hex #ff0000
        const size = box.getSize(new Vector3()).length();
        console.log('size', size);

        this.scene.add(helper);
        this.scene.add(model);
        this.scene.add(new GridHelper());
        console.log(model.getWorldPosition(new Vector3()));
        console.log('flower.position', model.position);
        console.log(model);

        // this.camera.lookAt(cube.position);
        const center = box.getCenter(new Vector3());
        // const { x: cx, y: cy, z: cz } = center;
        // console.log(`model center: ${cx}, ${cy}, ${cz}`);

        // model.position.x += model.position.x - center.x;
        // model.position.y += model.position.y - center.y;
        // model.position.z += model.position.z - center.z;
        // this.controls.maxDistance = size * 10;
        // this.camera.near = size / 100;
        // this.camera.far = size * 100;
        this.camera.updateProjectionMatrix();

        this.camera.position.copy(center);
        this.camera.position.x += size / 2.0;
        this.camera.position.y += size / 5.0;
        this.camera.position.z += size / 2.0;
        this.camera.lookAt(center);

        // this.scene.add(model);
    }
}
