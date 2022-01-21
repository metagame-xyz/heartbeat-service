import { ioredisClient } from '@utils';
import { ProductionNetworks, WEBSITE_URL } from '@utils/constants';

import { getBeatsPerMinute } from './frontend';
import { debug } from './logging';
import { getAllTransactions } from './requests';

/****************/
/* GET TXN DATA */
/****************/
export async function getTxnData(minterAddress: string): Promise<TxnCounts> {
    const address = minterAddress.toLowerCase();

    const txnCounts: TxnCounts = {};

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).getTime();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();

    const networks: ProductionNetworks[] = ['ethereum', 'polygon', 'fantom', 'avalanche'];

    for (const network of networks) {
        let transactions = [];
        try {
            transactions = await getAllTransactions(address, network);
        } catch (error) {
            throw error;
        }

        let txnsInLastDay = 0;
        let txnsInLastWeek = 0;
        let txnsInLastMonth = 0;
        const txnTotalCount = transactions.length;

        transactions.every((txn) => {
            const timestamp = txn.timeStamp * 1000;
            if (timestamp > oneDayAgo) {
                txnsInLastDay++;
            }

            if (timestamp > oneWeekAgo) {
                txnsInLastWeek++;
            }

            if (timestamp > oneMonthAgo) {
                txnsInLastMonth++;
            } else {
                return false;
            }
            return true;
        });

        txnCounts[network] = {
            totalTransactions: txnTotalCount,
            transactionsYesterday: txnsInLastDay,
            transactionsLastWeek: txnsInLastWeek,
            transactionsLastMonth: txnsInLastMonth,
        };
    }

    return txnCounts;
}

export type TxnCounts = {
    ethereum?: SingleNetworkTxnCounts;
    polygon?: SingleNetworkTxnCounts;
    fantom?: SingleNetworkTxnCounts;
    avalanche?: SingleNetworkTxnCounts;
};

export type SingleNetworkTxnCounts = {
    totalTransactions: number;
    transactionsYesterday: number;
    transactionsLastWeek: number;
    transactionsLastMonth: number;
};

export type Metadata = {
    name: string;
    description: string;
    image: string;
    externalUrl: string;
    animationUrl: string;
    address: string;
    txnCounts: TxnCounts;
    networkCount: number;
    beatsPerMinute: number;
};

const desc = (networkCount, beatsPerMinute) =>
    beatsPerMinute
        ? `A heart beating ${beatsPerMinute} beats per second across ${networkCount} chain${
              networkCount != 1 ? 's' : ''
          }.`
        : `A flatlining heart`;

const getNetworkCount = (txnCounts: TxnCounts) => {
    debug(txnCounts);
    return Object.values(txnCounts).reduce(
        (acc, curr) => (acc += curr.totalTransactions ? 1 : 0),
        0,
    );
};

export function formatNewMetadata(
    minterAddress: string,
    txnCounts: TxnCounts, // update
    userName: string,
    tokenId: string,
): Metadata {
    const networkCount = getNetworkCount(txnCounts);
    const beatsPerMinute = getBeatsPerMinute(txnCounts);

    const metadata: Metadata = {
        name: `${userName}'s Heartbeat`,
        description: desc(networkCount, beatsPerMinute),
        image: `https://${WEBSITE_URL}/growing.png`,
        externalUrl: `https://${WEBSITE_URL}/heart/${tokenId}`,
        animationUrl: `https://${WEBSITE_URL}/view/${tokenId}`,
        address: minterAddress,
        networkCount,
        beatsPerMinute,
        txnCounts,
    };

    return metadata;
}

export function formatMetadataWithOldMetadata(
    oldMetadata: Metadata,
    txnCounts: TxnCounts,
    userName: string,
): Metadata {
    const networkCount = getNetworkCount(txnCounts);

    debug(txnCounts);

    const beatsPerMinute = getBeatsPerMinute(txnCounts);

    const metadata: Metadata = {
        ...oldMetadata,
        name: `${userName}'s Heartbeat`,
        description: desc(networkCount, beatsPerMinute),
        networkCount,
        beatsPerMinute,
        txnCounts,
    };

    return metadata;
}

type Attributes = {
    display_type?: string;
    trait_type: string;
    value: any;
};

export type OpenSeaMetadata = {
    name: string;
    description: string;
    image: string;
    external_url: string;
    animation_url: string;
    iframe_url: string;
    attributes: Attributes[];
};

const camelCaseToSnakeCase = (str: string) =>
    str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
const snakeCaseToHumanReadable = (str: string) => str.replace(/_/g, ' ');
const camelCaseToHumanReadable = (str: string) =>
    snakeCaseToHumanReadable(camelCaseToSnakeCase(str));
const ccTohr = (str: string) => camelCaseToHumanReadable(str);
const titleCaseEveryWord = (str: string) =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

export function metadataToOpenSeaMetadata(metadata: Metadata): OpenSeaMetadata {
    const openseaMetadata: OpenSeaMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        external_url: metadata.externalUrl,
        animation_url: metadata.animationUrl,
        iframe_url: metadata.animationUrl,
        attributes: [
            {
                trait_type: 'address',
                value: metadata.address,
            },
            {
                trait_type: 'Active Network Count',
                value: metadata.networkCount,
            },
            {
                trait_type: 'Beats Per Minute',
                value: metadata.beatsPerMinute,
            },
        ],
    };

    for (const network in metadata.txnCounts) {
        const txnCounts = metadata.txnCounts[network];
        for (const key in txnCounts) {
            const value = txnCounts[key];
            if (value) {
                openseaMetadata.attributes.push({
                    trait_type: titleCaseEveryWord(`${network} ${ccTohr(key)}`),
                    value: Number(value),
                });
            }
        }
    }

    return openseaMetadata;
}

export async function getMetadata(tokenIdOrAddress: string): Promise<Metadata> {
    const metadata = await ioredisClient.hget(tokenIdOrAddress.toLowerCase(), 'metadata');

    if (!metadata) {
        throw new Error(`tokenId Or Address ${tokenIdOrAddress} not found`);
    }

    return JSON.parse(metadata);
}

export async function getTokenIdForAddress(address: string): Promise<string> {
    const tokenId = await ioredisClient.hget(address.toLowerCase(), 'tokenId');

    if (!tokenId) {
        throw new Error(`tokenId for address ${address} not found`);
    }

    return tokenId.toString();
}

export async function getAddressForTokenId(tokenId: string): Promise<string> {
    const address = await ioredisClient.hget(tokenId.toLowerCase(), 'address');

    if (!address) {
        throw new Error(`address for tokenId ${tokenId} not found`);
    }

    return address.toString();
}

export async function updateMetadata(metadata: Metadata, tokenId: string, address = null) {
    if (!address) {
        address = await getAddressForTokenId(tokenId);
    }

    await ioredisClient.hset(tokenId.toLowerCase(), 'metadata', JSON.stringify(metadata));
    await ioredisClient.hset(address.toLowerCase(), 'metadata', JSON.stringify(metadata));
}
