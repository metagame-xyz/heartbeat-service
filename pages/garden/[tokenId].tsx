import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import React, { useEffect } from 'react';

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
            const metadata = JSON.parse(metadataStr);
            const NFTs = metadata.NFTs;
            const garden = new GardenGrower(gardenEl);

            await garden.growFlower(NFTs[0], 0);
            // await garden.growFlower(NFTs[0], 1);
            garden.devHelper();

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
