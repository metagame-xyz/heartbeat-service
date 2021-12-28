import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import React, { useEffect } from 'react';
import { Event, Object3D } from 'three';
import THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { ioredisClient } from '@utils';
import GardenGrower from '@utils/Garden';
import { Metadata, NFTs } from '@utils/metadata';

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

            const metadata: Metadata = JSON.parse(metadataStr);
            const nfts: NFTs = metadata.nfts;
            const garden = new GardenGrower(gardenEl);

            // await garden.showFlowerExamples();

            const renderImmediately = true;

            await garden.addGround('flat_base_ground');
            garden.renderGround();
            // await garden.addGrass();
            // garden.renderGrass();
            // await garden.addPebbles();
            // garden.renderPebbles();
            garden.renderAllFlowers();

            const promiseAll = false;

            if (!promiseAll) {
                for (let [address, nft] of Object.entries(nfts)) {
                    await garden.growFlowerInSquare(address, nft.count, renderImmediately);
                }
            }

            if (promiseAll) {
                const promises = [];
                promises.push(garden.addGround('flat_base_ground'));
                for (let [address, nft] of Object.entries(nfts)) {
                    promises.push(garden.growFlowerInSquare(address, nft.count, renderImmediately));
                }
                await Promise.all(promises);
            }

            // if (!renderImmediately) {
            //     garden.renderAllModels();
            // }

            garden.positionCamera();
            garden.done();

            // garden.addGUI();
        }
        growGarden();
    }, []);

    return <Box id="garden" bgColor="grey" width="100vw" h="100vh"></Box>;
}

export default Garden;
