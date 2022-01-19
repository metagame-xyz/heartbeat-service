import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import { useEffect } from 'react';

import { ioredisClient } from '@utils';
import HeartGrower from '@utils/Heart';
import { Metadata } from '@utils/metadata';

export const getServerSideProps = async (context) => {
    const { tokenId } = context.query;
    // const metadata = await ioredisClient.hget(tokenId, 'metadata');
    return {
        props: {
            // metadata,
            tokenId,
        },
    };
};

function View({ tokenId: tokenIdStr }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    useEffect(() => {
        async function growHeart() {
            let wrapperEl = document.getElementById('heart');
            while (wrapperEl.firstChild) {
                wrapperEl.removeChild(wrapperEl.firstChild);
            }

            // const metadata: Metadata = JSON.parse(metadataStr);
            // const minterAddress = metadata.address;

            const heart = new HeartGrower(wrapperEl);

            // garden.addGUI();
        }
        growHeart();
    }, []);

    return <Box id="heart" bgColor="grey" width="400px" h="400px"></Box>;
}

export default View;
