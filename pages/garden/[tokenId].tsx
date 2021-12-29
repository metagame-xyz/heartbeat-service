import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, useToast, UseToastOptions } from '@chakra-ui/react';
import { InferGetServerSidePropsType, NextPageContext } from 'next';
import React, { useEffect } from 'react';

import { ioredisClient } from '@utils';
import { CONTRACT_ADDRESS, networkStrings } from '@utils/constants';
import GardenGrower from '@utils/Garden';
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
    console.log('showToast', showToast);
    const toast = useToast();
    const [showOpenseaButton, setShowOpenseaButton] = React.useState(false);
    useEffect(() => {
        async function growGarden() {
            let gardenEl = document.getElementById('garden');
            while (gardenEl.firstChild) {
                gardenEl.removeChild(gardenEl.firstChild);
            }

            const metadata: Metadata = JSON.parse(metadataStr);
            const minterAddress = metadata.address;
            const nfts: NFTs = metadata.nfts;
            const garden = new GardenGrower(gardenEl);

            // await garden.showFlowerExamples();

            await garden.addGround('flat_base_ground');
            garden.renderGround();
            await garden.addPebbles();
            garden.renderPebbles();
            garden.renderAllFlowers();

            for (let [address, nft] of Object.entries(nfts)) {
                await garden.growFlowerInSquare(address, nft.count, minterAddress);
            }

            garden.positionCamera();
            garden.done();

            if (showToast) {
                toast(
                    toastInfoData(
                        'Garden Status',
                        `Your Garden will take about 30 seconds to grow into an NFT. We'll let you know when it's ready!`,
                    ),
                );

                setTimeout(() => {
                    setShowOpenseaButton(true);
                }, 30_000);
            }
            // garden.addGUI();
        }
        growGarden();
    }, []);

    return (
        <Box>
            {showOpenseaButton && (
                <Flex w="100vw">
                    <Box
                        fontSize={[24, 24, 36]}
                        color="white"
                        position="absolute"
                        left="0"
                        right="0"
                        textAlign="center">
                        <Button
                            colorScheme="brand"
                            // color="white"
                            _hover={{ bgColor: 'brand.600' }}
                            _active={{ bgColor: 'brand.500' }}
                            m={6}
                            size="lg"
                            rightIcon={<ExternalLinkIcon />}
                            onClick={() => window.open(openseaLink(tokenId))}>
                            View on Opensea
                        </Button>
                    </Box>
                </Flex>
            )}
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
