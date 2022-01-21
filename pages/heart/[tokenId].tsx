import { Box, Center, SimpleGrid, Stack, Wrap, WrapItem } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import { useEffect, useState } from 'react';

import { ioredisClient } from '@utils';
import HeartGrower from '@utils/Heart';
import { Metadata } from '@utils/metadata';

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

function Heart({
    tokenId,
    metadata: metadataStr,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const [metadata, setMetadata] = useState<Metadata>();
    useEffect(() => {
        async function growHeart() {
            let wrapperEl = document.getElementById('heart');
            while (wrapperEl.firstChild) {
                wrapperEl.removeChild(wrapperEl.firstChild);
            }

            const metadata: Metadata = JSON.parse(metadataStr);
            setMetadata(metadata);

            const heart = new HeartGrower(wrapperEl);

            // garden.addGUI();
        }
        growHeart();
    }, []);

    // const attributes = (
    //     <>
    //         {Object.entries(metadata).map(([key, value]) => {
    //             return (
    //                 <h4 key={key}>
    //                     {key} : {value}
    //                 </h4>
    //             );
    //         })}
    //     </>
    // );

    return (
        <Box align="center" p="16px">
            <SimpleGrid minChildWidth="600px" spacing={4} align="center">
                <Box alignSelf="center" id="heart" bgColor="grey" width="" h="400px"></Box>
                <Box id="not-heart" bgColor="grey" width="400px" h="400px">
                    {/* {attributes} */}
                </Box>
            </SimpleGrid>
        </Box>
    );
}

export default Heart;
