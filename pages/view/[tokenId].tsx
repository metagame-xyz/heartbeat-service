import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import { useEffect } from 'react';

import { ioredisClient } from '@utils';
// import HeartGrower from '@utils/Heart';
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

    const metadata = JSON.parse(metadataStr);

    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <Heart
                address={metadata.address}
                attributes={getParametersFromTxnCounts(metadata.txnCounts)}
            />
        </div>
    );
}

export default View;
