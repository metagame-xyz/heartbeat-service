import { AspectRatio, Box, Center, SimpleGrid, Stack, Wrap, WrapItem } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import { useEffect, useState } from 'react';

import Heart from '@components/heart';

import { ioredisClient } from '@utils';
import HeartGrower from '@utils/Heart';
import { Metadata } from '@utils/metadata';
import { getParametersFromTxnCounts } from '@utils/parameters';

export const getServerSideProps = async (context) => {
    const { tokenId } = context.query;
    const metadata = await ioredisClient.hget(tokenId, 'metadata');
    return {
        props: {
            metadata,
            tokenId,
        },
    };
};

function HeartPage({
    tokenId,
    metadata: metadataStr,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const keysToKeep = [
        'name',
        'description',
        'address',
        // 'txnCounts',
        'networkCounts',
        'beatsPerMinute',
    ];

    const metadata = JSON.parse(metadataStr);
    const attributes = (metadata) => {
        return (
            <>
                {Object.entries(metadata)
                    .filter(([v, k]) => keysToKeep.includes(v))
                    .map(([key, value]) => {
                        console.log('key', key);
                        console.log('value', value);
                        return (
                            <>
                                <p key={key}>
                                    {key}: {value}
                                </p>
                            </>
                        );
                    })}
            </>
        );
    };
    return (
        <Box align="center" p="16px" minH="calc(100vh - 146px)">
            <SimpleGrid minChildWidth={[200, 400, 400, 400]} spacing={4}>
                <AspectRatio ratio={1}>
                    <Box h="100vh" w="100vw">
                        <Heart
                            address={metadata.address}
                            attributes={getParametersFromTxnCounts(metadata.txnCounts)}
                            // onSaveGif={onSaveGif}
                            // record={true}
                        />
                    </Box>
                </AspectRatio>
                <AspectRatio ratio={1}>
                    <Box id="not-heart">{/* <Box>{attributes(metadata)}</Box> */}</Box>
                </AspectRatio>
            </SimpleGrid>
        </Box>
    );
}

export default HeartPage;

// const HeartPage = () => <div>Hello</div>;
// export default HeartPage;
