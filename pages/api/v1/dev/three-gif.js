import { createWriteStream } from 'fs';
import GIFEncoder from 'gifencoder';
import { createCanvas } from 'node-canvas-webgl';
import {
    BoxGeometry,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from 'three';

export default async function handler(req, res) {
    const width = 512;
    const height = 512;

    const scene = new Scene();
    const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);

    const canvas = createCanvas(width, height);

    const renderer = new WebGLRenderer({
        canvas,
    });

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    const encoder = new GIFEncoder(width, height);
    encoder.createReadStream().pipe(createWriteStream('threejs-cube.gif'));
    encoder.start();
    encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
    encoder.setDelay(16); // frame delay in ms
    encoder.setQuality(10); // image quality. 10 is default.

    let idx = 0;
    async function update() {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
        if (idx > 0) {
            encoder.addFrame(canvas.__ctx__);
            console.log(`add frame ${idx}`);
        }
        idx++;
        if (idx < 100) {
            setTimeout(update, 16);
        }
    }
    await update();

    res.status(200).send({ message: 'ok' });
}
