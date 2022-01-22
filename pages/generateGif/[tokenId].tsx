import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import { useEffect } from 'react';

import { ioredisClient } from '@utils';
import {
    // EVENT_FORWARDER_AUTH_TOKEN,
    EVENT_FORWARDER_AUTH_TOKEN_HEADER, // INFURA_IPFS_PROJECT_ID,
    INFURA_IPFS_PROJECT_ID_HEADER, // INFURA_IPFS_SECRET,
    INFURA_IPFS_SECRET_HEADER,
} from '@utils/constants';
import HeartGrower from '@utils/Heart';
import { Metadata } from '@utils/metadata';

export const getServerSideProps = async ({ query, params, req, res }) => {
    const { tokenId } = params;
    console.log(tokenId);
    console.log('params', params);
    console.log('query', query);
    const INFURA_IPFS_PROJECT_ID = req.headers[INFURA_IPFS_PROJECT_ID_HEADER];
    const INFURA_IPFS_SECRET = req.headers[INFURA_IPFS_SECRET_HEADER];
    const EVENT_FORWARDER_AUTH_TOKEN = req.headers[EVENT_FORWARDER_AUTH_TOKEN_HEADER];

    if (!(INFURA_IPFS_PROJECT_ID && INFURA_IPFS_SECRET)) {
        return {
            notFound: true,
        };
    }

    const metadataStr = await ioredisClient.hget(tokenId, 'metadata');
    return {
        props: {
            tokenId,
            metadataStr,
            INFURA_IPFS_PROJECT_ID,
            INFURA_IPFS_SECRET,
            EVENT_FORWARDER_AUTH_TOKEN,
        },
    };
};

function View({
    tokenId,
    metadataStr,
    INFURA_IPFS_PROJECT_ID,
    INFURA_IPFS_SECRET,
    EVENT_FORWARDER_AUTH_TOKEN,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    useEffect(() => {
        async function growHeart() {
            const startTime = Date.now();
            let wrapperEl = document.getElementById('heart');
            while (wrapperEl.firstChild) {
                wrapperEl.removeChild(wrapperEl.firstChild);
            }

            const metadata: Metadata = JSON.parse(metadataStr);
            // const minterAddress = metadata.address;

            const heart = new HeartGrower(wrapperEl);
            heart.renderHeart(metadata);
            heart.enableIPFSUpload(
                INFURA_IPFS_PROJECT_ID,
                INFURA_IPFS_SECRET,
                EVENT_FORWARDER_AUTH_TOKEN,
                tokenId,
                startTime,
            );

            await heart.wait();

            heart.startRecording();

            // garden.addGUI();
        }
        growHeart();
    }, []);

    return <Box id="heart" bgColor="grey" width="400px" h="400px"></Box>;
}

export default View;
