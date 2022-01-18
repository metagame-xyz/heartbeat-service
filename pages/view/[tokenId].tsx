import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType } from 'next';
import { useEffect } from 'react';

import { ioredisClient } from '@utils';
import GardenGrower from '@utils/Heart';
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
        async function growGarden() {
            let gardenEl = document.getElementById('garden');
            while (gardenEl.firstChild) {
                gardenEl.removeChild(gardenEl.firstChild);
            }

            // const metadata: Metadata = JSON.parse(metadataStr);
            // const minterAddress = metadata.address;
            const garden = new GardenGrower(gardenEl);

            garden.done();

            garden.startRecording();

            // garden.addGUI();
        }
        growGarden();
    }, []);

    return <Box id="garden" bgColor="grey" width="20vw" h="20vh"></Box>;
}

export default View;
