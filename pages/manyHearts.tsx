import { Box, SimpleGrid } from '@chakra-ui/react';
import Chance from 'chance';
import { InferGetServerSidePropsType } from 'next';
import { useEffect } from 'react';

import Heart from '@components/heart';

import { ioredisClient } from '@utils';
// import HeartGrower from '@utils/Heart';
import { Metadata } from '@utils/metadata';
import { getParametersFromTxnCounts } from '@utils/parameters';

export const getServerSideProps = async (context) => {
    const metadataArr = [];

    for (let i = 1; i <= 20; i++) {
        const metadata = await ioredisClient.hget(i.toString(), 'metadata');

        metadataArr.push(metadata);
    }
    return {
        props: {
            metadataArr,
        },
    };
};

function View({ metadataArr }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    // useEffect(() => {
    //     async function growHeart() {
    //         let wrapperEl = document.getElementById('heart');
    //         while (wrapperEl.firstChild) {
    //             wrapperEl.removeChild(wrapperEl.firstChild);
    //         }

    //         const metadata: Metadata = JSON.parse(metadataStr);
    //         // const minterAddress = metadata.address;

    //         const heart = new HeartGrower(wrapperEl);
    //         heart.renderHeart(metadata);

    //         // garden.addGUI();
    //     }
    //     growHeart();
    // }, []);

    const many = metadataArr.map((metadataStr, index) => {
        const metadata = JSON.parse(metadataStr);
        const size = '350px';
        return (
            <Box key={index} h={size} w={size}>
                <Heart
                    address={metadata.address}
                    attributes={getParametersFromTxnCounts(metadata.txnCounts)}
                />
            </Box>
        );
    });

    return (
        <SimpleGrid columns={5} spacing={0}>
            {many}
        </SimpleGrid>
    );
}

export default View;
