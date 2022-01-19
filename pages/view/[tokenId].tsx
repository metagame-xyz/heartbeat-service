import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import { useEffect } from 'react';

import { ioredisClient } from '@utils';
import HeartGrower from '@utils/Heart';
import { Metadata } from '@utils/metadata';

export const getServerSideProps = async (context) => {
    const { tokenId } = context.query;
    // const metadata = await ioredisClient.hget(tokenId, 'metadata');
    const INFURA_IPFS_PROJECT_ID = `23plK2SBslHLkCW7WIAGKAodfC4`;
    const INFURA_IPFS_SECRET = '32f19a4859c2bbf4b593fb2c98ad0c2c';
    return {
        props: {
            // metadata,
            tokenId,
            INFURA_IPFS_PROJECT_ID,
            INFURA_IPFS_SECRET,
        },
    };
};

function View({
    tokenId: tokenIdStr,
    INFURA_IPFS_PROJECT_ID,
    INFURA_IPFS_SECRET,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    useEffect(() => {
        async function growHeart() {
            let wrapperEl = document.getElementById('heart');
            while (wrapperEl.firstChild) {
                wrapperEl.removeChild(wrapperEl.firstChild);
            }

            // const metadata: Metadata = JSON.parse(metadataStr);
            // const minterAddress = metadata.address;

            const heart = new HeartGrower(wrapperEl);
            heart.enableIPFSUpload(INFURA_IPFS_PROJECT_ID, INFURA_IPFS_SECRET);

            await heart.done();

            heart.startRecording();

            // garden.addGUI();
        }
        growHeart();
    }, []);

    return <Box id="heart" bgColor="grey" width="400px" h="400px"></Box>;
}

export default View;
