import { Box } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import p5Types from 'p5';
import React from 'react';

const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
    ssr: false,
});

function Example() {
    const canvasSize = 800;
    let x = 50;
    const y = 50;
    let flowerImg: p5Types.Image;

    const preload = (p: p5Types) => {
        flowerImg = p.loadImage('/Flower.png');
    };

    //See annotations in JS for more information
    const setup = (p: p5Types, canvasParentRef: Element) => {
        p.createCanvas(canvasSize, canvasSize).parent(canvasParentRef);
        p.noStroke();
        p.noLoop();
    };

    const drawFlower = (p: p5Types, xRand, yRand, w, h) => {
        p.image(flowerImg, xRand, yRand, w, h);
    };

    const draw = (p: p5Types) => {
        p.background('#8B4513'); //brown background hex #8B4513

        const sizer = 4;
        const w = flowerImg.width / sizer;
        console.log(w);
        const h = flowerImg.height / sizer;
        console.log(h);

        for (let i = 0; i < 10; i++) {
            const xRand = p.random(0, canvasSize * 0.9);
            const yRand = p.random(0, canvasSize * 0.9);
            drawFlower(p, xRand, yRand, w, h);
        }
    };

    return (
        <Box align="center" m="4">
            <Sketch setup={setup} draw={draw} preload={preload} />
        </Box>
    );
}

export default Example;
