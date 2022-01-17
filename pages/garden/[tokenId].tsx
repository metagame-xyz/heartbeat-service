import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, useToast, UseToastOptions } from '@chakra-ui/react';
import { InferGetServerSidePropsType, NextPageContext } from 'next';
import React, { useEffect } from 'react';
import Countdown, { zeroPad } from 'react-countdown';

import { ioredisClient } from '@utils';
import { CONTRACT_ADDRESS, networkStrings } from '@utils/constants';
import GardenGrower from '@utils/Heart';
import { Metadata, NFTs } from '@utils/metadata';

const toastInfoData = (title: string, description: string): UseToastOptions => ({
    title,
    description,
    status: 'info',
    position: 'top',
    duration: 8000,
    isClosable: true,
});

function openseaLink(tokenId: number): string {
    return `https://${networkStrings.opensea}opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId}`;
}

export const getServerSideProps = async (context: NextPageContext) => {
    const { tokenId, showToast } = context.query;
    const metadataStr = await ioredisClient.hget(tokenId.toString(), 'metadata');
    return {
        props: {
            metadataStr,
            tokenId,
            showToast: !!showToast,
        },
    };
};

function Garden({
    metadataStr,
    tokenId,
    showToast,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const toast = useToast();
    const [showCountdown, setShowCountdown] = React.useState(false);

    const countdownRenderer = ({ days, hours, minutes, seconds, completed }) => {
        if (completed) {
            // Render a completed state
            return (
                <Button
                    colorScheme="brand"
                    // color="white"
                    _hover={{ bgColor: 'brand.600' }}
                    _active={{ bgColor: 'brand.500' }}
                    size="lg"
                    rightIcon={<ExternalLinkIcon />}
                    onClick={() => window.open(openseaLink(tokenId))}>
                    View on Opensea
                </Button>
            );
        } else {
            // Render a countdown
            return <Box color="brand.300">00:{zeroPad(seconds)}</Box>;
        }
    };

    useEffect(() => {
        async function growGarden() {
            let gardenEl = document.getElementById('garden');
            while (gardenEl.firstChild) {
                gardenEl.removeChild(gardenEl.firstChild);
            }

            const metadata: Metadata = JSON.parse(metadataStr);
            const minterAddress = metadata.address;
            const garden = new GardenGrower(gardenEl, true);

            garden.renderAllFlowers();

            garden.positionCamera();
            garden.done();

            if (showToast) {
                toast(
                    toastInfoData(
                        'Garden Status',
                        `Your Garden will take about 30 seconds to grow into an NFT. We'll let you know when it's ready!`,
                    ),
                );
                setShowCountdown(true);
            }
            // garden.addGUI();
        }
        growGarden();
    }, []);

    return (
        <Box>
            <Flex w="100vw">
                <Box
                    fontSize={24}
                    color="white"
                    position="absolute"
                    left="0"
                    right="0"
                    textAlign="center">
                    {showCountdown && (
                        <Box m={6}>
                            <Countdown date={Date.now() + 30_000} renderer={countdownRenderer} />
                        </Box>
                    )}
                </Box>
            </Flex>
            <Flex
                alignContent="center"
                margin="auto"
                id="garden"
                bgColor="grey"
                width="100vw"
                h="calc(100vh - 146px)"></Flex>
        </Box>
    );
}

export default Garden;
