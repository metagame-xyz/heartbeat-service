import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import { useEffect } from 'react';

import Heart from '@components/heart';

import { ioredisClient } from '@utils';
import {
    // EVENT_FORWARDER_AUTH_TOKEN,
    EVENT_FORWARDER_AUTH_TOKEN_HEADER, // INFURA_IPFS_PROJECT_ID,
    INFURA_IPFS_PROJECT_ID_HEADER, // INFURA_IPFS_SECRET,
    INFURA_IPFS_SECRET_HEADER,
} from '@utils/constants';
import { addBlobToIPFS, clickableIPFSLink, createIPFSClient, updateImage } from '@utils/frontend';
import { Metadata } from '@utils/metadata';
import { getParametersFromTxnCounts } from '@utils/parameters';

export const getServerSideProps = async ({ query, params, req, res }) => {
    const { tokenId } = params;
    const INFURA_IPFS_PROJECT_ID = req.headers[INFURA_IPFS_PROJECT_ID_HEADER];
    const INFURA_IPFS_SECRET = req.headers[INFURA_IPFS_SECRET_HEADER];
    const EVENT_FORWARDER_AUTH_TOKEN = req.headers[EVENT_FORWARDER_AUTH_TOKEN_HEADER];

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
    if (!(INFURA_IPFS_PROJECT_ID && INFURA_IPFS_SECRET)) {
        return <div></div>;
    }

    async function onSaveGif(blob, startTime) {
        const IPFSClient = createIPFSClient(INFURA_IPFS_PROJECT_ID, INFURA_IPFS_SECRET);

        const url = await addBlobToIPFS(IPFSClient, blob);
        const secondsElapsed = (Date.now() - startTime) / 1000;
        const response = await updateImage(
            tokenId,
            url,
            EVENT_FORWARDER_AUTH_TOKEN,
            secondsElapsed,
        );
        console.log('url:', clickableIPFSLink(url));
    }

    // async function onSaveGif(blob, _) {
    //     const fileURL = window.URL.createObjectURL(blob);
    //     const tempLink = document.createElement('a');
    //     tempLink.href = fileURL;
    //     tempLink.setAttribute('download', `test.gif`);
    //     tempLink.click();
    // }

    const metadata = JSON.parse(metadataStr);

    const size = '350px';

    return (
        <Box h={size} w={size}>
            <Heart
                address={metadata.address}
                record={true}
                attributes={getParametersFromTxnCounts(metadata.txnCounts)}
                onSaveGif={onSaveGif}
                frameCount={120}
            />
        </Box>
    );
}

export default View;
