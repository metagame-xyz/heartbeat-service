import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import { useEffect } from 'react';

import { ioredisClient } from '@utils';
import {
    INFURA_IPFS_PROJECT_ID,
    INFURA_IPFS_PROJECT_ID_HEADER,
    INFURA_IPFS_SECRET,
    INFURA_IPFS_SECRET_HEADER,
} from '@utils/constants';
import HeartGrower from '@utils/Heart';
import { Metadata } from '@utils/metadata';

export const getServerSideProps = async ({ query, params, req, res }) => {
    const { tokenId } = params;
    console.log(tokenId);
    console.log('params', params);
    console.log('query', query);
    // const INFURA_IPFS_PROJECT_ID = req.headers[INFURA_IPFS_PROJECT_ID_HEADER];
    // const INFURA_IPFS_SECRET = req.headers[INFURA_IPFS_SECRET_HEADER];
    // console.log('req', INFURA_IPFS_PROJECT_ID);
    // console.log('req', INFURA_IPFS_SECRET);

    // if (!(INFURA_IPFS_PROJECT_ID && INFURA_IPFS_SECRET)) {
    //     return {
    //         notFound: true,
    //     };
    // }

    // const metadata = await ioredisClient.hget(tokenId, 'metadata');
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

            await heart.wait();

            // heart.startRecording();

            // garden.addGUI();
        }
        growHeart();
    }, []);

    return <Box id="heart" bgColor="grey" width="400px" h="400px"></Box>;
}

export default View;
