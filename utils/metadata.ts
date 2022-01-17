import { logger } from 'ethers';

import { ioredisClient } from '@utils';
import { ProductionNetworks, WEBSITE_URL } from '@utils/constants';

import { getBeatsPerMinute } from './frontend';
import { debug } from './logging';
import { getAllTransactions } from './requests';

/****************/
/* GET TXN DATA */
/****************/
export async function getTxnData(minterAddress: string): Promise<any> {
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
            total: txnTotalCount,
            lastDay: txnsInLastDay,
            lastWeek: txnsInLastWeek,
            lastMonth: txnsInLastMonth,
        };
    }

    return txnCounts;
}

export type TxnCounts = {
    ethereum?: SingleNetworkTxnCounts;
    polygon?: SingleNetworkTxnCounts;
};

export type SingleNetworkTxnCounts = {
    total: number;
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
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
    return Object.values(txnCounts).reduce((acc, curr) => (acc += curr.total ? 1 : 0), 0);
};

export function formatNewMetadata(
    minterAddress: string,
    txnCounts: TxnCounts, // update
    userName: string,
    tokenId: string,
): Metadata {
    const networkCount = getNetworkCount(txnCounts);
    const beatsPerMinute =
        getBeatsPerMinute(txnCounts.ethereum.lastDay, txnCounts.ethereum.lastWeek) || 0;

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

export function updateMetadata(
    oldMetadata: Metadata,
    txnCounts: TxnCounts,
    userName: string,
): Metadata {
    const networkCount = getNetworkCount(txnCounts);

    const beatsPerMinute = getBeatsPerMinute(txnCounts[0].lastDay, txnCounts[1].lastWeek);

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

export function metadataToOpenSeaMetadata(metadata: Metadata): OpenSeaMetadata {
    const openseaMetadata: OpenSeaMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        external_url: metadata.externalUrl,
        animation_url: metadata.animationUrl,
        iframe_url: metadata.animationUrl,
        attributes: [
            // properties
            {
                trait_type: 'address',
                value: metadata.address,
            },
        ],
    };

    // for (const nft of specialNFTs) {
    //     openseaMetadata.attributes.push({
    //         trait_type: nft.tokenName,
    //         value: `mints: ${nft.count}`,
    //     });
    // }

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
