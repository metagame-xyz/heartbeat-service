import { Box } from '@chakra-ui/layout';
import { useEffect, useRef, useState } from 'react';
import {
    Box3,
    BoxGeometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Scene,
    sRGBEncoding,
    TextureLoader,
    Vector3,
    WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const size = '600px';

function Vis() {
    const mount = useRef(null);
    const [isAnimating, setAnimating] = useState(true);
    const controls = useRef(null);

    useEffect(() => {
        let width = mount.current.clientWidth;
        let height = mount.current.clientHeight;
        let frameId;

        const scene = new Scene();
        const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
        const renderer = new WebGLRenderer({ antialias: true });
        const geometry = new BoxGeometry(1, 1, 1);
        const textureLoader = new TextureLoader();
        const texture = textureLoader.load('/uv_test_bw_1024.png');
        const material = new MeshBasicMaterial({ map: texture });
        texture.encoding = sRGBEncoding;
        texture.anisotropy = 16;
        const cube = new Mesh(geometry, material);
        const gltfLoader = new GLTFLoader();
        let flower: Group;

        gltfLoader.load(
            '/lowPolyFlower.glb',
            function (gltf) {
                console.log('loading model');
                flower = gltf.scene;
                flower.scale.set(0.1 / 7, 0.1 / 13, 0.1 / 5);
                flower.position.set(0, 0, 0);
                scene.add(flower);
                console.log('flower', flower);
                scene.add(cube);
                console.log('cube', cube);
                console.log('model added');
                const boundingBox = new Box3().setFromObject(cube);
                const size = boundingBox.getSize(new Vector3()); // Returns Vector3
                console.log(size);
                const flowerBoundingBox = new Box3().setFromObject(flower);
                const flowerSize = flowerBoundingBox.getSize(new Vector3()); // Returns Vector3
                console.log(flowerSize);
            },
            undefined,
            function (error) {
                console.error(error);
            },
        );

        camera.position.z = 4;
        // scene.add(cube);
        renderer.setClearColor('#000000');
        renderer.setSize(width, height);

        const renderScene = () => {
            renderer.render(scene, camera);
        };

        const handleResize = () => {
            width = mount.current.clientWidth;
            height = mount.current.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderScene();
        };

        const animate = () => {
            // cube.rotation.x += 0.01;
            // cube.rotation.y += 0.01;
            // cube.scale.x += 0.01;
            // cube.scale.y += 0.01;
            if (flower) {
                // console.log('flower');
                flower.scale.x += 0.01;
                flower.scale.y += 0.01;
                console.log(flower.scale.x);
                console.log(cube.scale.x);
            }
            // console.log('flower', flower.scale);
            // flower.scale.set(0.1 / 7, 0.1 / 13, 0.1 / 5);
            // console.log(flower);
            // flower.scale.y += 0.01;
            // if (flower) {
            //     console.log('rotating');
            //     flower.rotation.x += 0.01;
            //     flower.rotation.y += 0.01;
            // }

            renderScene();
            frameId = window.requestAnimationFrame(animate);
        };

        const start = () => {
            if (!frameId) {
                frameId = requestAnimationFrame(animate);
            }
        };

        const stop = () => {
            cancelAnimationFrame(frameId);
            frameId = null;
        };

        mount.current.appendChild(renderer.domElement);
        window.addEventListener('resize', handleResize);
        start();

        controls.current = { start, stop };

        return () => {
            stop();
            window.removeEventListener('resize', handleResize);
            mount.current.removeChild(renderer.domElement);

            // scene.remove(cube);
            geometry.dispose();
            material.dispose();
        };
    }, []);

    useEffect(() => {
        if (isAnimating) {
            controls.current.start();
        } else {
            controls.current.stop();
        }
    }, [isAnimating]);

    return (
        <Box align="center" m="4">
            <div
                style={{ height: size, width: size }}
                className="vis"
                ref={mount}
                onClick={() => setAnimating(!isAnimating)}
            />
        </Box>
    );
}

export default Vis;
