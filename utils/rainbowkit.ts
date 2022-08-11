import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { ALCHEMY_PROJECT_ID } from 'utils/constants';
import { chain, configureChains, createClient } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

const { chains, provider } = configureChains(
    [chain.mainnet, chain.rinkeby],
    [alchemyProvider({ apiKey: ALCHEMY_PROJECT_ID }), publicProvider()],
);

const { connectors } = getDefaultWallets({
    appName: 'Logbook',
    chains,
});

const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
});

export { chains, wagmiClient };
