import { ChakraProvider, extendTheme, Flex } from '@chakra-ui/react';
import { datadogRum } from '@datadog/browser-rum';
import '@fontsource/courier-prime';
import '@fontsource/lato';
import { lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import {
    DATADOG_RUM_APPLICATION_ID,
    DATADOG_RUM_CLIENT_TOKEN,
    DATADOG_RUM_ENV,
} from 'utils/constants';
import { chains, wagmiClient } from 'utils/rainbowkit';
import { WagmiConfig } from 'wagmi';

import leftBg from '../images/left-bg.png';
import rightBg from '../images/right-bg.png';
import '../styles/globals.css';
import { theme } from '../styles/theme';

const bgSize = ['100px', '120px', '220px', '300px'];

function App({ Component, pageProps }: AppProps): JSX.Element {
    const { route } = useRouter();

    const hideNav =
        route.includes('generateGif') || route.includes('view') || route.includes('test');

    useEffect(() => {
        datadogRum.init({
            applicationId: DATADOG_RUM_APPLICATION_ID,
            clientToken: DATADOG_RUM_CLIENT_TOKEN,
            site: 'datadoghq.com',
            service: 'logbook',
            env: DATADOG_RUM_ENV,
            // Specify a version number to identify the deployed version of your application in Datadog
            // version: '1.0.0',
            sampleRate: 100,
            premiumSampleRate: 13,
            trackInteractions: true,
            defaultPrivacyLevel: 'mask-user-input',
        });
        // datadogRum.startSessionReplayRecording()
    }, []);

    if (hideNav) {
        return <Component {...pageProps} />;
    } else {
        const EthereumProvider = dynamic(() => import('../providers/EthereumProvider'));
        const Layout = dynamic(() => import('@components/Layout'));

        return (
            <WagmiConfig client={wagmiClient}>
                <RainbowKitProvider chains={chains} theme={lightTheme()}>
                    <ChakraProvider theme={theme}>
                        <EthereumProvider>
                            <Flex
                                // backgroundImage={leftBg.src}
                                // bgBlendMode="overlay"
                                // bgPosition={'left 0px top -70px'}
                                // bgSize={bgSize}
                                width="100%"
                                // bgRepeat="no-repeat repeat"
                            >
                                <Flex
                                    // backgroundImage={rightBg.src}
                                    width="100%"
                                    // bgPosition={'right 0px top -70px'}
                                    // bgSize={bgSize}
                                    // bgRepeat="no-repeat repeat"
                                >
                                    <Flex bgColor="brand.100opaque" width="100%">
                                        <Layout>
                                            <Component {...pageProps} />
                                        </Layout>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </EthereumProvider>
                    </ChakraProvider>
                </RainbowKitProvider>
            </WagmiConfig>
        );
    }
}

export default App;
