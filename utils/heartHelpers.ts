// import { OrbitControls, useAnimations } from '@react-three/drei';
// import { Canvas, useFrame } from '@react-three/fiber';
// import { extend } from '@react-three/fiber';
// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import * as THREE from 'three';
// import Web3 from 'web3';

// import noise from '@utils/noise';

// const web3 = new Web3(Web3.givenProvider);

// export const scaleFn = (x) => x * 5;

// export const animationClip = new THREE.AnimationClip(null, scaleFn(1), [
//     new THREE.NumberKeyframeTrack(
//         '.time',
//         [0, 0.2, 0.4, 0.6, 0.8, 1].map(scaleFn),
//         [1, 1.2, 1.4, 1.5, 1.3, 1].map(scaleFn),
//         THREE.InterpolateSmooth,
//     ),
// ]);

// const Model = ({ color, colorContrast, record, onLoop, ...props }) => {
//     const blobMaterial = useRef();
//     const uColor = useMemo(() => new THREE.Color(color), [color]);
//     const uColorContrast = useMemo(() => new THREE.Color(colorContrast), [colorContrast]);
//     const { mixer } = useAnimations([]);

//     useFrame(
//         ({ gl }, timeElapsed) => {
//             blobMaterial.current.time += timeElapsed;
//         },
//         [record],
//     );

//     return (
//         <mesh>
//             <icosahedronGeometry args={[1, 64]} />
//             <blobMaterial
//                 ref={blobMaterial}
//                 color={uColor}
//                 colorContrast={uColorContrast}
//                 {...props}
//             />
//         </mesh>
//     );
// };

// export const BaseHeart = (props) => {
//     const gl = useRef();
//     const capturer = useMemo(() => {
//         if (!props.record || typeof window === 'undefined') return null;
//         const CCapture = require('./ccapture.js');
//         const c = new CCapture({
//             format: 'gif',
//             quality: 100,
//             framerate: 60,
//         });
//         return c;
//     }, [props.record]);
//     const duration = 100;
//     const [isCaptured, setIsCaptured] = useState(false);
//     const capturing = useRef(false);
//     const captured = useRef(false);
//     const frame = useRef(0);
//     const loop = useCallback(() => {
//         if (!capturing.current && !captured.current) {
//             capturing.current = true;
//             capturer.start();
//         }

//         if (capturing.current && !captured.current) {
//             capturer.capture(gl.current.domElement);
//         }

//         if (frame.current > 10 && !captured.current) {
//             capturing.current = false;
//             captured.current = true;
//             capturer.stop();
//             capturer.save((blob) => {
//                 const fileURL = window.URL.createObjectURL(blob);
//                 const tempLink = document.createElement('a');
//                 tempLink.href = fileURL;
//                 tempLink.setAttribute('download', `test.gif`);
//                 tempLink.click();
//                 const div = document.createElement('div');
//                 document.body.appendChild(div);
//                 div.classList.add(div);
//             });
//         }

//         frame.current += 1;

//         requestAnimationFrame(loop);
//     }, []);

//     const bind = useCallback(
//         (context) => {
//             if (props.record) {
//                 context.gl.setSize(800, 800);
//                 context.gl.setClearColor('#00FF00');
//                 gl.current = context.gl;
//                 requestAnimationFrame(loop);
//             }
//         },
//         [duration],
//     );

//     return (
//         <>
//             <Canvas
//                 gl={{
//                     preserveDrawingBuffer: true,
//                 }}
//                 onCreated={bind}
//                 dpr={[1, 2]}
//                 camera={{ fov: 60, position: [-3, 2, -3] }}>
//                 <Model {...props} />
//                 <OrbitControls enableZoom={false} />
//             </Canvas>
//         </>
//     );
// };

// export const lerpColor = (a, b, amount) => {
//     let ah = +a.replace('#', '0x'),
//         ar = ah >> 16,
//         ag = (ah >> 8) & 0xff,
//         ab = ah & 0xff,
//         bh = +b.replace('#', '0x'),
//         br = bh >> 16,
//         bg = (bh >> 8) & 0xff,
//         bb = bh & 0xff,
//         rr = ar + amount * (br - ar),
//         rg = ag + amount * (bg - ag),
//         rb = ab + amount * (bb - ab);

//     return '#' + (((1 << 24) + (rr << 16) + (rg << 8) + rb) | 0).toString(16).slice(1);
// };

// export const lerp = (value1, value2) => (amount) => {
//     amount = amount < 0 ? 0 : amount;
//     amount = amount > 1 ? 1 : amount;
//     return value1 + (value2 - value1) * amount;
// };

// export const hclamp = (h) => {
//     h /= 100;
//     if (h >= 0) {
//         return h % 360;
//     } else {
//         return (-1 * h) % 360;
//     }
// };
// export const round = (fn) => (x) => Math.round(fn(x / 99) * 99);
// export const easeInOutCubic = round((x) =>
//     x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
// );
// export const easeInQuint = round((x) => x * x * x * x * x);
// export const toString = ([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`;

// export const generateColor = (address) => {
//     const bytes = web3.utils.hexToBytes(web3.utils.padLeft(address, 64));
//     const startHue = (bytes[31 - 12] * 24) / 17;
//     const startLightness = (bytes[31 - 2] * 5) / 34 + 32;
//     const endLightness = (97 + (bytes[31 - 8] * 5) / 51 + 72) / 2;
//     const startSaturation = bytes[31 - 7] / 16 + 81;
//     const endSaturation = (bytes[31 - 10] * 11) / 128 + 70;

//     const hueBase = (100 - easeInOutCubic(100)) * startHue + easeInOutCubic(100) * (startHue + 145);
//     const hue = hclamp(hueBase);
//     const satPercent = easeInQuint(10);
//     const saturation =
//         1 + ((100.0 - satPercent) * startSaturation + satPercent * endSaturation) / 100;
//     const lightPercent = easeInQuint(10);
//     const lightness =
//         1 + ((100.0 - lightPercent) * startLightness + lightPercent * endLightness) / 100;
//     return [hue, Math.round(saturation), Math.round(lightness)];
// };

// export const interpolators = {
//     spikes: lerp(1, 4.25),
//     speed: lerp(0, 1),
//     intensity: lerp(1, 2),
//     polygonActivity: lerp(0, 4),
//     avalancheActivity: lerp(0, 4),
//     fantomActivity: lerp(0, 4),
// };

// const Heart = ({ address, record, attributes }) => {
//     const [h, s, l] = useMemo(() => generateColor(address), [address]);
//     const color = toString(attributes.contrast ? [h, s, l] : [h, 0, l]);
//     const colorContrast = useMemo(
//         () => lerpColor('#262626', '#f3f4f6', attributes.ethereumActivity),
//         [attributes.ethereumActivity],
//     );
//     const interpolatedAttributes = Object.keys(interpolators).reduce((acc, key) => {
//         acc[key] = interpolators[key](attributes[key]);
//         return acc;
//     }, {});

//     console.log({ address, interpolatedAttributes });

//     return (
//         <BaseHeart
//             color={color}
//             colorContrast={colorContrast}
//             amplitude={1.15}
//             frequency={1.4}
//             record={record}
//             // recordOptions={recordOptions}
//             {...interpolatedAttributes}
//         />
//     );
// };

// export default Heart;

export default null;
