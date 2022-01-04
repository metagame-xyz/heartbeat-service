import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import React, { useEffect } from 'react';

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
            const minterAddress = metadata.address;
            const nfts: NFTs = metadata.nfts;
            const garden = new GardenGrower(gardenEl);

            await garden.addGround('flat_base_ground');
            garden.renderGround();
            await garden.addPebbles(minterAddress);
            garden.renderPebbles();
            await garden.addPlants(minterAddress);
            garden.renderPlants();
            garden.renderAllFlowers();

            for (let [address, nft] of Object.entries(nfts)) {
                await garden.growFlowerInSquare(address, nft.count, minterAddress);
            }

            garden.positionCamera();
            garden.done();

            // garden.addGUI();
        }
        growGarden();
    }, []);

    return <Box id="garden" bgColor="grey" width="100vw" h="100vh"></Box>;
}

export default Garden;
