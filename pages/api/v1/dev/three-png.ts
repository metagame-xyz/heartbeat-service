import { writeFileSync } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas } from 'node-canvas-webgl';
import {
    BoxGeometry,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from 'three';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const width = 512;
    const height = 512;

    const scene = new Scene();
    const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);

    const canvas = createCanvas(width, height);

    const renderer = new WebGLRenderer({
        canvas,
    });

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 'brown' });
    const cube = new Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    cube.rotation.x += 1;
    cube.rotation.y += 1;

    renderer.render(scene, camera);

    const img = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    writeFileSync('threejs-cube.png', img);
    res.send(img);
}
