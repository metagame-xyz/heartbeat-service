import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';

// import { useEffect } from 'react';
import { ioredisClient } from '@utils';

// import HeartGrower from '@utils/Heart';
// import { Metadata } from '@utils/metadata';

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

    // return <Box position="absolute" id="heart" bgColor="blue" w="400px" h="400px"></Box>;
    return (
        <Box position="absolute" id="heart" bgColor="blue" w="400px" h="400px">
            Hi Hello {tokenId}
        </Box>
    );
}

export default View;
