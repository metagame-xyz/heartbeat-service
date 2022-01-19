import * as CanvasCapture from 'canvas-capture';

import '@utils/gif.worker';

// import '@utils/coi-serviceworker';
import logo from '../images/rainbow.png';

const GIF_OPTIONS = {
    name: 'demo-gif',
    quality: 1,
    fps: 60,
    onExportProgress: (progress: number) => console.log(`GIF export progress: ${progress}.`),
    onExportFinish: () => console.log(`Finished GIF export.`),
};

export class CanvasMaker {
    el: HTMLElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    angle: number;
    image: HTMLImageElement;
    frameCount: number;

    constructor(el: HTMLElement) {
        this.el = el;
        this.canvas = document.createElement('canvas');
        this.canvas.width = el.clientWidth;
        this.canvas.height = el.clientHeight;

        this.el.appendChild(this.canvas);

        this.context = this.canvas.getContext('2d')!;
        this.angle = 0;
        this.image = document.createElement('img');
        this.image.src = logo.src;

        this.frameCount = 0;

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Wait until is loaded.
        if (this.image.width) {
            this.frameCount++;
            // Draw black background
            this.context.beginPath();
            this.context.fillStyle = 'black';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            // Renter rotated image.
            this.context.save();
            this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.context.rotate(this.angle);
            this.context.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
            this.context.restore();
            // Increase rotation.
            this.angle += 0.02;
        }

        // // You need to do this only if you are recording a video or gif.
        if (CanvasCapture.isRecording()) CanvasCapture.recordFrame();

        if (this.frameCount === 30) {
            CanvasCapture.stopRecord();
        }
    }

    startRecording() {
        CanvasCapture.init(this.canvas);
        CanvasCapture.beginGIFRecord(GIF_OPTIONS);
    }
}

export const aFunction = () => {
    console.log('aFunction');
};
