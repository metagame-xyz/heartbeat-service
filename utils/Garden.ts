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
        this.positionCamera();

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

        const scaleFactor = 0.05;
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

        const model = await this.getModel('Hydrangea2');

        // size = getSize(model);
        // console.log('size', size);

        model.scale.setScalar(scaleFactor);

        // size = getSize(model);
        // console.log('size', size);

        model.position.set(position, 0, position);

        this.scene.add(model);
    }

    positionCamera() {
        this.camera.position.x = 2;
        this.camera.position.y = 10;
        this.camera.position.z = 10;
        this.camera.lookAt(0, 0, 0);
    }

    devHelper() {
        // Grid at the bottom
        this.scene.add(new GridHelper(24, 24));

        var axesHelper = new AxesHelper(5);
        this.scene.add(axesHelper);

        // red box around each model
        const objects = this.scene.children.filter((child) => child instanceof Mesh);
        for (const object of objects) {
            this.scene.add(new BoxHelper(object, new Color(0xff0000)));
        }
    }
}
