import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import React, { useEffect } from 'react';
import { Event, Object3D } from 'three';
import THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { ioredisClient } from '@utils';
import GardenGrower from '@utils/Garden';

export const getServerSideProps = async (context) => {
    const { tokenId } = context.query;
    const metadata = await ioredisClient.hget(tokenId, 'metadata');

    // const gltfFile = await fetch(`https://tokengarden.loca.lt/Hydrangea4.glb`).then((res) =>
    //     res.blob(),
    // );
    // const arrayBuffergltf = await gltfFile.arrayBuffer();

    // function getModel(modelName: string): Promise<Object3D<Event>> {
    //     return new Promise((resolve, reject) => {
    //         const loader = new GLTFLoader();

    //         // loader.load(
    //         //     `/${modelName}.glb`,
    //         //     (gltf) => {
    //         //         resolve(gltf.scene.children[0]);
    //         //     },
    //         //     undefined,
    //         //     reject,
    //         // );
    //     });
    // }

    // const model = await getModel('Hydrangea4');
    // console.log(model);

    return {
        props: {
            metadata,
            // arrayBuffergltf,
        },
    };
};

function Garden({ metadata: metadataStr }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    useEffect(() => {
        async function growGarden() {
            let gardenEl = document.getElementById('garden');
            while (gardenEl.firstChild) {
                gardenEl.removeChild(gardenEl.firstChild);
            }
            const metadata = JSON.parse(metadataStr);
            const NFTs = metadata.NFTs;
            const garden = new GardenGrower(gardenEl);
            // console.log(arrayBuffergltf);
            // await garden.injectFlower(arrayBuffergltf);

            // for (let i = 0; i < 59; i++) {
            //     await garden.growFlower(NFTs[i]);
            // }

            // await garden.showFlowerExamples();

            const promises = [];

            for (let nft of NFTs) {
                promises.push(garden.growFlower(nft));
            }

            await Promise.all(promises);
            console.log(metadata);
            garden.initDevHelper();
        }
        growGarden();
    }, []);

    return <Box id="garden" bgColor="grey" width="100vw" h="100vh"></Box>;
}

export default Garden;
