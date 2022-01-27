import { Box } from '@chakra-ui/react';
import Chance from 'chance';
import { InferGetServerSidePropsType } from 'next';
import { useEffect } from 'react';

import { ioredisClient } from '@utils';
import { Metadata } from '@utils/metadata';
import { getParametersFromTxnCounts } from '@utils/parameters';

import Heart from '../../components/heart/index.jsx';

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

function View({
    tokenId,
    metadata: metadataStr,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
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

    async function onSaveGif(blob, _) {
        const fileURL = window.URL.createObjectURL(blob);
        const tempLink = document.createElement('a');
        tempLink.href = fileURL;
        tempLink.setAttribute('download', `test-${new Chance().name()}.gif`);
        tempLink.click();
    }

    const metadata = JSON.parse(metadataStr);

    return (
        <Box h="100vh" w="100vw">
            <Heart
                address={metadata.address}
                attributes={getParametersFromTxnCounts(metadata.txnCounts)}
                // onSaveGif={onSaveGif}
                // record={true}
            />
        </Box>
    );
}

export default View;
