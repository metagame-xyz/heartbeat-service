// export const NETWORK = process.env.NETWORK;
export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
export const POLYSCAN_API_KEY = process.env.POLYSCAN_API_KEY;
export const CONTRACT_BIRTHBLOCK = Number(process.env.CONTRACT_BIRTHBLOCK);
export const REDIS_URL = process.env.REDIS_URL;
export const EVENT_FORWARDER_AUTH_TOKEN = process.env.EVENT_FORWARDER_AUTH_TOKEN;
export const INFURA_IPFS_PROJECT_ID = process.env.INFURA_IPFS_PROJECT_ID;
export const INFURA_IPFS_SECRET = process.env.INFURA_IPFS_SECRET;
export const URL_BOX_API_SECRET = process.env.URL_BOX_API_SECRET;
export const URLBOX_API_KEY = process.env.URLBOX_API_KEY;
export const POCKET_NETWORK_API_KEY = process.env.POCKET_NETWORK_API_KEY;
export const POCKET_NETWORK_ID = process.env.POCKET_NETWORK_ID;
export const ALCHEMY_NOTIFY_TOKEN = process.env.ALCHEMY_NOTIFY_TOKEN;
export const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
export const DATADOG_API_KEY = process.env.DATADOG_API_KEY;
export const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN;

/* Frontend Constants */
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS.toLowerCase();
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK.toLowerCase();
export const INFURA_PROJECT_ID = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;
export const ALCHEMY_PROJECT_ID = process.env.NEXT_PUBLIC_ALCHEMY_PROJECT_ID;
export const GOOGLE_ANALYTICS_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
// heartbeat.loca.lt, dev.heartbeat.art, heartbeat.art
export const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL;
export const networkStrings = getNetworkString(NETWORK);
export const THE_METAGAME_ETH_ADDRESS = '0x902A37155438982884ca26A5DBccf73f5ae8194b';
export const doneDivClass = 'done';

/* Events */
export const connect_button_clicked = 'Connect Button Clicked';
export const wallet_provider_clicked = 'Wallet Provider Clicked';
export const wallet_provider_connected = 'Wallet Provider Connected';

type NetworkStrings = {
    alchemy: string;
    ethers: string;
    etherscan: string;
    etherscanAPI: string;
    polyscanAPI: string;
    opensea: string;
    openseaAPI: string;
    web3Modal: string;
};

function getNetworkString(network: string): NetworkStrings {
    switch (network.toLowerCase()) {
        case 'ethereum':
            return {
                alchemy: 'eth-mainnet.',
                ethers: 'homestead',
                etherscan: '',
                etherscanAPI: 'api.',
                polyscanAPI: 'api.',
                opensea: '',
                openseaAPI: 'api.',
                web3Modal: 'mainnet',
            };

        default:
            return {
                alchemy: `eth-${network}.`,
                ethers: network,
                etherscan: `${network}.`,
                etherscanAPI: `api-${network}.`,
                polyscanAPI: `api-testnet.`,
                opensea: 'testnets.',
                openseaAPI: `${network}-api.`, // rinkeby only for now
                web3Modal: network,
            };
    }
}



export type ProductionNetworks = 'ethereum' | 'polygon' | 'fantom' | 'avax';

export const networkScanAPIKeys = {
    ethereum: ETHERSCAN_API_KEY,
    polygon: POLYSCAN_API_KEY,
    // fantom: FTMSCAN_API_KEY, // fantom
    // avax: SNOWTRACE_API_KEY, // avax
};

export const productionNetworkApiURLs = {
    ethereum: 'api.etherscan.io',
    polygon: 'api.polyscan.com',
    fantom: 'api.ftmscan.com',
    avax: 'api.snowtrace.io',


}

export const blackholeAddress = '0x0000000000000000000000000000000000000000';

export const slackErrorsChannelId = '';
