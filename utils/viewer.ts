import { GUI } from 'dat.gui';
import {
    AmbientLight,
    Box3,
    Cache,
    DirectionalLight,
    Event,
    Group,
    Light,
    LoadingManager,
    Object3D,
    PerspectiveCamera,
    Scene,
    sRGBEncoding,
    Vector3,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

declare global {
    interface Window {
        renderer: WebGLRenderer;
        content: Object3D<Event> | Group;
    }
}

Cache.enabled = true;

export class Viewer {
    el: HTMLElement;

    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    controls: OrbitControls;

    lights: Light[];
    gui: GUI;
    state: {
        background: boolean;
        playbackSpeed: number;
        addLights: boolean;
        exposure: number;
        ambientIntensity: number;
        ambientColor: number;
        directIntensity: number;
        directColor: number;
    };

    constructor(el: HTMLElement) {
        this.el = el;
        this.lights = [];
        this.gui = null;

        this.state = {
            background: false,
            playbackSpeed: 1.0,

            // Lights
            addLights: true,
            exposure: 1.0,
            ambientIntensity: 0.3,
            ambientColor: 0xffffff,
            directIntensity: 0.8 * Math.PI, // TODO(#116)
            directColor: 0xffffff,
        };

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.01, 1000);
        this.scene.add(this.camera);

        this.renderer = new WebGLRenderer({ antialias: true });
        // this.renderer.physicallyCorrectLights = true;  // TODO add to options
        this.renderer.outputEncoding = sRGBEncoding;
        this.renderer.setClearColor(0xcccccc); // background clear is grey instead of black
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(el.clientWidth, el.clientHeight);
        // console.log('el', el, el.clientHeight, el.clientWidth);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.el.appendChild(this.renderer.domElement);

        this.addGUI();

        this.updateLights();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    animate() {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }


    load(modelName: string) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader(new LoadingManager());

            loader.load(
                `/${modelName}.glb`,
                (gltf) => {
                    this.setContent(gltf.scene);
                    resolve(gltf);
                },
                undefined,
                reject,
            );
        });
    }

    setContent(object: Object3D<Event> | Group) {
        console.log('setContent', object);

        const { x, y, z } = object.position;

        console.log(`object position: ${x}, ${y}, ${z}`);

        const box = new Box3().setFromObject(object);
        const size = box.getSize(new Vector3()).length();
        const center = box.getCenter(new Vector3());
        const { x: cx, y: cy, z: cz } = center;
        console.log(`object center: ${cx}, ${cy}, ${cz}`);


        object.position.x += object.position.x - center.x;
        object.position.y += object.position.y - center.y;
        object.position.z += object.position.z - center.z;
        this.controls.maxDistance = size * 10;
        this.camera.near = size / 100;
        this.camera.far = size * 100;
        this.camera.updateProjectionMatrix();

        this.camera.position.copy(center);
        this.camera.position.x += size / 2.0;
        this.camera.position.y += size / 5.0;
        this.camera.position.z += size / 2.0;
        this.camera.lookAt(center);

        this.scene.add(object);
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

        const light1 = new AmbientLight(state.ambientColor, state.ambientIntensity);
        light1.name = 'ambient_light';
        this.camera.add(light1);

        const light2 = new DirectionalLight(state.directColor, state.directIntensity);
        light2.position.set(0.5, 0, 0.866); // ~60º
        light2.name = 'main_light';
        this.camera.add(light2);

        this.lights.push(light1, light2);
    }

    removeLights() {
        this.lights.forEach((light: { parent: { remove: (arg0: any) => any } }) =>
            light.parent.remove(light),
        );
        this.lights.length = 0;
    }

    addGUI() {
        const gui = (this.gui = new GUI({ autoPlace: false, width: 260, hideable: true }));
        // Lighting controls.
        const lightFolder = gui.addFolder('Lighting');
        [
            lightFolder.add(this.state, 'exposure', 0, 2),
            lightFolder.add(this.state, 'addLights').listen(),
            lightFolder.add(this.state, 'ambientIntensity', 0, 2),
            lightFolder.addColor(this.state, 'ambientColor'),
            lightFolder.add(this.state, 'directIntensity', 0, 4), // TODO(#116)
            lightFolder.addColor(this.state, 'directColor'),
        ].forEach((ctrl) => ctrl.onChange(() => this.updateLights()));

        const guiWrap = document.createElement('div');
        this.el.appendChild(guiWrap);
        guiWrap.classList.add('gui-wrap');
        guiWrap.appendChild(gui.domElement);
        gui.open();
    }
}
