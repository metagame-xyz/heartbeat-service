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
    return {
        props: {
            metadata,
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
