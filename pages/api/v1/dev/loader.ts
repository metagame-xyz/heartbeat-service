import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

function toArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('hello');

    // function getModel(modelName: ArrayBuffer): Promise<Object3D<Event>> {
    //     return new Promise((resolve, reject) => {
    //         const loader = new GLTFLoader();

    //         loader.parse(
    //             glbFile,
    //             '',
    //             (gltf) => {
    //                 resolve(gltf.scene.children[0]);
    //             },
    //             reject,
    //         );
    // loader.load(
    //     `/${modelName}.glb`,
    //     (gltf) => {
    //         resolve(gltf.scene.children[0]);
    //     },
    //     undefined,
    //     reject,
    // );
    //     });
    // }

    // const glbFile = await fetch(`https://tokengarden.loca.lt/Hydrangea4.glb`).then((res) =>
    //     res.buffer(),
    // );
    // console.log(glbFile);
    // const arrayBufferGlb = toArrayBuffer(glbFile);
    // console.log(arrayBufferGlb);
    // const model = await getModel(arrayBufferGlb);

    res.send({ ok: 'ok' });
}
