import { Flex } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import React, { useEffect } from 'react';

import { ioredisClient } from '@utils';
import GardenGrower from '@utils/Garden';
import { Metadata, NFTs } from '@utils/metadata';

export const getServerSideProps = async (context) => {
    const { tokenId } = context.query;
    const metadataStr = await ioredisClient.hget(tokenId, 'metadata');
    return {
        props: {
            metadataStr,
        },
    };
};

function Garden({ metadataStr }: InferGetServerSidePropsType<typeof getServerSideProps>) {
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

            const promises = [];

            promises.push(garden.addGround(3));

            for (let [address, nft] of Object.entries(nfts)) {
                promises.push(garden.growFlowerInSquare(address, nft.count, metadata.address));
            }

            await Promise.all(promises);
            // console.log(metadata);
            garden.initDevHelper();
        }
        growGarden();
    }, []);

    return (
        <Flex
            alignContent="center"
            margin="auto"
            id="garden"
            bgColor="grey"
            width="100vw"
            h="calc(100vh - 146px)"></Flex>
    );
}

export default Garden;
