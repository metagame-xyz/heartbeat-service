import {
    Avatar,
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    Spacer,
    Text,
    useBreakpointValue,
} from '@chakra-ui/react';
import React from 'react';

import { useEthereum } from '@providers/EthereumProvider';

import { Etherscan, Logo, Opensea, Twitter } from '@components/Icons';

import { copy } from '@utils/content';

function Navbar(props) {
    const { userName, openWeb3Modal, avatarUrl } = useEthereum();

    const showName = useBreakpointValue({ base: false, md: true });

    return (
        <Flex width="100%" bgColor="transparent" boxShadow="md">
            <HStack
                as="nav"
                width="100%"
                margin="auto"
                justify="center"
                align="center"
                p={4}
                {...props}>
                <HStack align="center" spacing={2} pr={[0, 2]}>
                    <Logo boxSize={10} />
                    {showName && (
                        <Heading as="h1" fontSize="34px">
                            {copy.title}
                        </Heading>
                    )}
                </HStack>
                <Spacer />
                <HStack align="center" spacing={[3, 4, 5, 6]}>
                    <Twitter />
                    <Opensea />
                    <Etherscan />
                </HStack>
            </HStack>
        </Flex>
    );
}

export default Navbar;
