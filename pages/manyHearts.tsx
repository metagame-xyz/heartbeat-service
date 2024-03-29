import { Box, Center, SimpleGrid } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';

import Heart from '@components/heart';

import { ioredisClient } from '@utils';
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
    const parsed: Metadata[] = metadataArr.map((metadata) => {
        return JSON.parse(metadata);
    });
    const sorted = parsed.sort((a, b) => {
        return b.txnCounts.ethereum.totalTransactions - a.txnCounts.ethereum.totalTransactions;
    });

    // sorted.forEach((metadata) => {
    //     console.log(metadata.txnCounts.total);
    // });
    const top = sorted.slice(0, 10);

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
