import { ChakraProvider, extendTheme, Flex } from '@chakra-ui/react';
import '@fontsource/courier-prime';
import '@fontsource/lato';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';

import Layout from '@components/Layout';

import leftBg from '../images/left-bg.png';
import rightBg from '../images/right-bg.png';
import EthereumProvider from '../providers/EthereumProvider';
import '../styles/globals.css';
import { theme } from '../styles/theme';

const bgSize = ['100px', '120px', '220px', '300px'];

function App({ Component, pageProps }: AppProps): JSX.Element {
    const { route } = useRouter();

    return route.includes('privateGarden') ? (
        <Component {...pageProps} />
    ) : (
        <ChakraProvider theme={theme}>
            <EthereumProvider>
                <Flex
                    backgroundImage={leftBg.src}
                    bgBlendMode="overlay"
                    bgPosition={'left 0px top -70px'}
                    bgSize={bgSize}
                    width="100%"
                    bgRepeat="no-repeat repeat">
                    <Flex
                        backgroundImage={rightBg.src}
                        width="100%"
                        bgPosition={'right 0px top -70px'}
                        bgSize={bgSize}
                        bgRepeat="no-repeat repeat">
                        <Flex bgColor="brand.100opaque" width="100%">
                            <Layout>
                                <Component {...pageProps} />
                            </Layout>
                        </Flex>
                    </Flex>
                </Flex>
            </EthereumProvider>
        </ChakraProvider>
    );
}

export default App;
