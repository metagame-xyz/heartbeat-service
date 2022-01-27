import { OrbitControls, useAnimations } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { extend } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import Web3 from 'web3';

import noise from '@utils/noise';

const web3 = new Web3(Web3.givenProvider);

class BlobMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color('#FF2C55') },
                uColorContrast: { value: new THREE.Color('darkgray') },
                uSpeed: { value: 0.1 },
                uNoiseDensity: { value: 1.2 },
                uNoiseStrength: { value: 0.3 },
                uFrequency: { value: 4 },
                uAmplitude: { value: 0.15 },
                uIntensity: { value: 1.0 },
                uNetwork1: { value: 1 },
                uNetwork2: { value: 0.2 },
                uNetwork3: { value: 0.2 },
            },
            vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying float vDistort;
      
      uniform float uTime;
      uniform float uSpeed;
      uniform float uNoiseDensity;
      uniform float uNoiseStrength;
      uniform float uFrequency;
      uniform float uAmplitude;
      
      ${noise}
      
      mat3 rotation3dY(float angle) {
        float s = sin(angle);
        float c = cos(angle);
    
        return mat3(
          c, 0.0, -s,
          0.0, 1.0, 0.0,
          s, 0.0, c
        );
      }
    
      vec3 rotateY(vec3 v, float angle) {
        return rotation3dY(angle) * v;
      }

      void main() {
        vUv = uv;
        vNormal = normal;
        
        float t = uTime * uSpeed;
        float distortion = pnoise((normal + t) * uNoiseDensity, vec3(10.0)) * (uNoiseDensity * .15);

        vec3 pos = position + (normal * distortion);
        float angle = sin(uv.y * uFrequency + t) * uAmplitude;
        pos = rotateY(pos, angle);    
        
        vDistort = distortion;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }`,
            fragmentShader: `
      varying float vDistort;
      varying vec3 vNormal;

      uniform float uNetwork1;
      uniform float uNetwork2;
      uniform float uNetwork3;
      uniform vec3 uColor;
      uniform vec3 uColorContrast;
      uniform float uIntensity;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uSpeed;


      vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
        return a + b * cos(6.28318 * (c * t + d));
      }

      vec3 rgb(float r, float g, float b) {
        return vec3(r / 255., g / 255., b / 255.);
      }

      vec3 rgb(float c) {
        return vec3(c / 255., c / 255., c / 255.);
      }

      ${noise}

      void main() {

        float distort = vDistort * uIntensity;

        vec3 brightness = uColor;
        vec3 oscilation = vec3(1.2, 1.2, 1.2);
        vec3 phase = vec3(0.2, 0.2, 0.2);
        vec3 contrast = uColorContrast;
        vec3 color = cosPalette(distort, brightness, contrast, oscilation, phase);

        float t = uTime * uSpeed;
        float noise1 = pnoise((vNormal + t * 0.08), vec3(10.0)) * uIntensity;
        float noise2 = pnoise((vNormal * 2. + t * 0.2), vec3(10.0)) * uIntensity;

        vec3 color1 = cosPalette(distort, rgb(92.0, 89.0, 235.0), contrast, oscilation, phase);
        vec3 color2 = cosPalette(distort, rgb(255.0, 154.0, 0.0), contrast, oscilation, phase);

        color = mix(color, rgb(92.0, 89.0, 235.0), noise1 * uNetwork1);
        color = mix(color, rgb(255.0, 44.0, 85.0), noise2 * uNetwork2);
        color = mix(color, rgb(5.0, 161.0, 252.0), noise1 * uNetwork3);
        gl_FragColor = vec4(color, 1.0);
      }`,
        });
    }

    get time() {
        return this.uniforms.uTime.value;
    }

    set time(v) {
        this.uniforms.uTime.value = v;
    }

    set color(v) {
        return (this.uniforms.uColor.value = v);
    }
    set colorContrast(v) {
        return (this.uniforms.uColorContrast.value = v);
    }
    set spikes(v) {
        return (this.uniforms.uNoiseDensity.value = v);
    }
    set intensity(v) {
        return (this.uniforms.uIntensity.value = v);
    }
    set noiseStrength(v) {
        return (this.uniforms.uNoiseStrength.value = v);
    }
    set speed(v) {
        return (this.uniforms.uSpeed.value = v);
    }
    set frequency(v) {
        return (this.uniforms.uFrequency.value = v);
    }
    set amplitude(v) {
        return (this.uniforms.uAmplitude.value = v);
    }
    set polygonActivity(v) {
        return (this.uniforms.uNetwork1.value = v);
    }
    set avalancheActivity(v) {
        return (this.uniforms.uNetwork2.value = v);
    }
    set fantomActivity(v) {
        return (this.uniforms.uNetwork3.value = v);
    }
}

extend({ BlobMaterial });

const scaleFn = (x) => x * 5;

const animationClip = new THREE.AnimationClip(null, scaleFn(1), [
    new THREE.NumberKeyframeTrack(
        '.time',
        [0, 0.2, 0.4, 0.6, 0.8, 1].map(scaleFn),
        [1, 1.2, 1.4, 1.5, 1.3, 1].map(scaleFn),
        THREE.InterpolateSmooth,
    ),
]);

const Model = ({ color, colorContrast, record, onLoop, ...props }) => {
    const blobMaterial = useRef();
    const uColor = useMemo(() => new THREE.Color(color), [color]);
    const uColorContrast = useMemo(() => new THREE.Color(colorContrast), [colorContrast]);
    const { mixer } = useAnimations([]);

    useFrame(
        ({ gl }, timeElapsed) => {
            blobMaterial.current.time += timeElapsed;
        },
        [record],
    );

    return (
        <mesh>
            <icosahedronGeometry args={[1, 64]} />
            <blobMaterial
                ref={blobMaterial}
                color={uColor}
                colorContrast={uColorContrast}
                {...props}
            />
        </mesh>
    );
};

export const BaseHeart = (props) => {
    const gl = useRef();
    const capturer = useMemo(() => {
        if (!props.record || typeof window === 'undefined') return null;
        const CCapture = require('./ccapture.js');
        const c = new CCapture({
            format: 'gif',
            quality: 100,
            framerate: 60,
        });
        return c;
    }, [props.record]);
    const duration = 100;
    const [isCaptured, setIsCaptured] = useState(false);
    const capturing = useRef(false);
    const captured = useRef(false);
    const frame = useRef(0);
    const loop = useCallback(() => {
        if (!capturing.current && !captured.current) {
            capturing.current = true;
            capturer.start();
        }

        if (capturing.current && !captured.current) {
            capturer.capture(gl.current.domElement);
        }

        if (frame.current > 10 && !captured.current) {
            capturing.current = false;
            captured.current = true;
            capturer.stop();
            capturer.save(async (blob) => {
                await props.onSaveGif(blob);
                // const fileURL = window.URL.createObjectURL(blob);
                // const tempLink = document.createElement('a');
                // tempLink.href = fileURL;
                // tempLink.setAttribute('download', `test.gif`);
                // tempLink.click();
                const div = document.createElement('div');
                document.body.appendChild(div);
                div.classList.add('done');
            });
        }

        frame.current += 1;

        requestAnimationFrame(loop);
    }, []);

    const bind = useCallback(
        (context) => {
            if (props.record) {
                // context.gl.setSize(800, 800);
                gl.current = context.gl;
                requestAnimationFrame(loop);
            }
        },
        [duration],
    );

    return (
        <>
            <Canvas
                gl={{
                    preserveDrawingBuffer: true,
                }}
                onCreated={bind}
                dpr={[1, 2]}
                camera={{ fov: 60, position: [-3, 2, -3] }}>
                <Model {...props} />
                <OrbitControls enableZoom={false} />
            </Canvas>
        </>
    );
};

const lerpColor = (a, b, amount) => {
    let ah = +a.replace('#', '0x'),
        ar = ah >> 16,
        ag = (ah >> 8) & 0xff,
        ab = ah & 0xff,
        bh = +b.replace('#', '0x'),
        br = bh >> 16,
        bg = (bh >> 8) & 0xff,
        bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);

    return '#' + (((1 << 24) + (rr << 16) + (rg << 8) + rb) | 0).toString(16).slice(1);
};

const lerp = (value1, value2) => (amount) => {
    amount = amount < 0 ? 0 : amount;
    amount = amount > 1 ? 1 : amount;
    return value1 + (value2 - value1) * amount;
};

const hclamp = (h) => {
    h /= 100;
    if (h >= 0) {
        return h % 360;
    } else {
        return (-1 * h) % 360;
    }
};
const round = (fn) => (x) => Math.round(fn(x / 99) * 99);
const easeInOutCubic = round((x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2));
const easeInQuint = round((x) => x * x * x * x * x);
const toString = ([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`;

const generateColor = (address) => {
    const bytes = web3.utils.hexToBytes(web3.utils.padLeft(address, 64));
    const startHue = (bytes[31 - 12] * 24) / 17;
    const startLightness = (bytes[31 - 2] * 5) / 34 + 32;
    const endLightness = (97 + (bytes[31 - 8] * 5) / 51 + 72) / 2;
    const startSaturation = bytes[31 - 7] / 16 + 81;
    const endSaturation = (bytes[31 - 10] * 11) / 128 + 70;

    const hueBase = (100 - easeInOutCubic(100)) * startHue + easeInOutCubic(100) * (startHue + 145);
    const hue = hclamp(hueBase);
    const satPercent = easeInQuint(10);
    const saturation =
        1 + ((100.0 - satPercent) * startSaturation + satPercent * endSaturation) / 100;
    const lightPercent = easeInQuint(10);
    const lightness =
        1 + ((100.0 - lightPercent) * startLightness + lightPercent * endLightness) / 100;
    return [hue, Math.round(saturation), Math.round(lightness)];
};

const interpolators = {
    spikes: lerp(1, 4.25),
    speed: lerp(0, 1),
    intensity: lerp(1, 2),
    polygonActivity: lerp(0, 4),
    avalancheActivity: lerp(0, 4),
    fantomActivity: lerp(0, 4),
};

const Heart = ({ address, record, attributes, onSaveGif }) => {
    const [h, s, l] = useMemo(() => generateColor(address), [address]);
    const color = toString(attributes.contrast ? [h, s, l] : [h, 0, l]);
    const colorContrast = useMemo(
        () => lerpColor('#262626', '#f3f4f6', attributes.ethereumActivity),
        [attributes.ethereumActivity],
    );
    const interpolatedAttributes = useMemo(
        () =>
            Object.keys(interpolators).reduce((acc, key) => {
                acc[key] = interpolators[key](attributes[key]);
                return acc;
            }, {}),
        [attributes],
    );

    console.log({ address, interpolatedAttributes });

    return (
        <BaseHeart
            color={color}
            colorContrast={colorContrast}
            amplitude={1.15}
            frequency={1.4}
            record={record}
            onSaveGif={onSaveGif}
            {...interpolatedAttributes}
        />
    );
};
Heart.defaultProps = {
    onSaveGif: null,
    record: false,
};

export default Heart;
