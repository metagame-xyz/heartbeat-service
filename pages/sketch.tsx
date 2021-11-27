import { Box } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import p5Types from 'p5';
import React from 'react';

const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
    ssr: false,
});

function Example() {
    const canvasSize = 600;
    let x = 50;
    const y = 50;
    let img: p5Types.Image;

    const preload = (p: p5Types) => {
        img = p.loadImage('/Flower.png');
    };

    //See annotations in JS for more information
    const setup = (p: p5Types, canvasParentRef: Element) => {
        p.createCanvas(canvasSize, canvasSize).parent(canvasParentRef);
        p.noStroke();
        p.noLoop();
    };

    const drawTarget = (p, xloc, yloc, size, num) => {
        const grayvalues = 255 / num;
        const steps = size / num;
        for (let i = 0; i < num; i++) {
            p.fill(i * grayvalues);
            p.ellipse(xloc, yloc, size - i * steps, size - i * steps);
        }
    };

    const draw = (p: p5Types) => {
        p.background('#8B4513'); //brown background hex #8B4513

        for (let i = 0; i < 10; i++) {
            const xRand = p.random(0, canvasSize * 0.9);
            const yRand = p.random(0, canvasSize * 0.9);
            p.image(img, xRand, yRand, img.width / 6, img.height / 6);
        }
    };
    return (
        <Box align="center" m="4">
            <Sketch setup={setup} draw={draw} preload={preload} />
        </Box>
    );
}

export default Example;
