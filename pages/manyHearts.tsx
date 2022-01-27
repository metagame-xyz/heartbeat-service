import { Box, Center, SimpleGrid } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';

import Heart from '@components/heart';

import { ioredisClient } from '@utils';
// import HeartGrower from '@utils/Heart';
import { Metadata } from '@utils/metadata';
import { getParametersFromTxnCounts } from '@utils/parameters';

export const getServerSideProps = async (context) => {
    const metadataArr = [];

    for (let i = 1; i <= 70; i++) {
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

    const parsed: Metadata[] = metadataArr.map((metadata) => {
        return JSON.parse(metadata);
    });
    const sorted = parsed.sort((a, b) => {
        return b.txnCounts.ethereum.totalTransactions - a.txnCounts.ethereum.totalTransactions;
    });

    // sorted.forEach((metadata) => {
    //     console.log(metadata.txnCounts.total);
    // });
    const top = sorted.slice(-15)

    const many = top.map((metadata, index) => {
        const size = '350px';
        return (
            <Box key={index} h={size} w={size}>
                <Heart
                    address={metadata.address}
                    attributes={getParametersFromTxnCounts(metadata.txnCounts)}
                />
                <Center>{metadata.txnCounts.ethereum.totalTransactions}</Center>
            </Box>
        );
    });

    return (
        <SimpleGrid columns={5} spacing={6} py={8}>
            {many}
        </SimpleGrid>
    );
}

export default View;
