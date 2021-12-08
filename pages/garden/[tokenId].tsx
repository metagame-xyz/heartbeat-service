import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import React, { useEffect } from 'react';
import { Event, LoadingManager, Object3D } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { ioredisClient } from '@utils';
import GardenGrower from '@utils/Garden';

function getModel(modelName: string): Promise<Object3D<Event>> {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader(new LoadingManager());

        loader.load(
            `/${modelName}.glb`,
            (gltf) => {
                resolve(gltf.scene.children[0]);
            },
            undefined,
            reject,
        );
    });
}

export const getServerSideProps = async (context) => {
    const { tokenId } = context.query;
    const metadata = await ioredisClient.hget(tokenId, 'metadata');

    const model = await getModel('Hydrangea4');

    return {
        props: {
            metadata,
            model,
        },
    };
};

function Garden({
    metadata: metadataStr,
    model,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    useEffect(() => {
        async function growGarden() {
            let gardenEl = document.getElementById('garden');
            while (gardenEl.firstChild) {
                gardenEl.removeChild(gardenEl.firstChild);
            }
            const metadata = JSON.parse(metadataStr);
            const NFTs = metadata.NFTs;
            const garden = new GardenGrower(gardenEl);
            garden.injectFlower(model);

            // for (let i = 0; i < 59; i++) {
            //     await garden.growFlower(NFTs[i]);
            // }
            garden.initDevHelper();

            // for (let nft of NFTs) {
            //     garden.growFlower(nft);
            // }
            // console.log(metadata);
        }
        growGarden();
    }, []);

    return <Box id="garden" bgColor="grey" width="100vw" h="100vh"></Box>;
}

export default Garden;
