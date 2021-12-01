// import { loadImage } from 'canvas';
// import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';

// import p5Types from 'p5';
// import p5 from 'p5js-node';
// import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // const canvasSize = 800;
    // let flowerImg;
    // let x = 50;
    // const y = 50;
    // let p5Instance = new p5(sketch);
    // function sketch(p: p5): void {
    //     // p.preload = () => {
    //     // };
    //     p.setup = function () {
    //         p.createCanvas(canvasSize, canvasSize);
    //         console.log('setup');
    //         // THIS DOESNT WORK. FUCK THIS PACKAGE
    //         const imgPromise = loadImage('https://birthblock.loca.lt/Flower.png');
    //         imgPromise.then(
    //             (img) => {
    //                 console.log(img);
    //                 console.log('flowering!!!');
    //                 flowerImg = img;
    //             }, // img
    //         );
    //     };
    //     const drawFlower = (p: p5Types, xRand, yRand, w, h) => {
    //         p.image(flowerImg, xRand, yRand, w, h);
    //     };
    //     function drawCanvas(p) {
    //         p.background('#8B4513'); //brown background hex #8B4513
    //         const sizer = 4;
    //         const w = flowerImg.width / sizer;
    //         console.log(w);
    //         const h = flowerImg.height / sizer;
    //         console.log(h);
    //         for (let i = 0; i < 10; i++) {
    //             const xRand = p.random(0, canvasSize * 0.9);
    //             const yRand = p.random(0, canvasSize * 0.9);
    //             drawFlower(p, xRand, yRand, w, h);
    //         }
    //     }
    //     p.draw = function () {
    //         drawCanvas(p);
    //         p.noLoop();
    //         console.log('Hello World');
    //         send(p.canvas.toBuffer());
    //     };
    //     const send = (buffer) => {
    //         fs.writeFileSync('tes2.png', buffer);
    //         res.setHeader('Content-Type', 'image/png');
    //         res.send(buffer);
    //     };
    // }
    // const buffer = p5Instance.canvas.toBuffer();
    // fs.writeFileSync('test.png', buffer);
    res.send({ message: 'hello world!' });
}
