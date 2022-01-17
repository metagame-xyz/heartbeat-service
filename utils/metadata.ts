import Chance from 'chance';

import { ioredisClient } from '@utils';
import { WEBSITE_URL } from '@utils/constants';
import { logger } from '@utils/logging';

import { getBeatsPerMinute } from './frontend';
import { getAllTransactions } from './requests';

export type NftEvent = {
    tokenSymbol: string;
    from?: string;
    timeStamp?: number;
    contractAddress?: string;
    tokenName: string;
    count?: number;
    special?: boolean;
};

export type NFTs = {
    string?: NftEvent;
};

/****************/
/* GET TXN DATA */
/****************/
export async function getTxnData(minterAddress: string): Promise<any> {
    const address = minterAddress.toLowerCase();

    const ethereumTransactions = await getAllTransactions(address, 'ethereum');

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).getTime();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();

    let txnsInLastDay = 0;
    let txnsInLastWeek = 0;
    const txnTotalCount = ethereumTransactions.length;

    ethereumTransactions.every((txn) => {
        const timestamp = txn.timeStamp * 1000;
        if (timestamp > oneDayAgo) {
            txnsInLastDay++;
        }

        if (timestamp > oneWeekAgo) {
            txnsInLastWeek++;
        } else {
            return false;
        }
        return true;
    });

    return {
        ethereum: [txnsInLastDay, txnsInLastWeek, txnTotalCount],
    };
}

type TxnCounts = {
    total: number;
    lastDay: number;
    lastWeek: number;
};

export type Metadata = {
    name: string;
    description: string;
    image: string;
    externalUrl: string;
    animationUrl: string;
    address: string;
    txnCounts: TxnCounts[];
    networkCount: number;
    beatsPerSecond: number;
};

const desc = (networkCount, beatsPerMinute) =>
    `A heart beating ${beatsPerMinute} beats per second across ${networkCount} chain${
        networkCount > 1 ? 's' : ''
    }.`;

export function formatNewMetadata(
    minterAddress: string,
    txnCounts: TxnCounts[], // update
    userName: string,
    tokenId: string,
): Metadata {
    const networkCount = txnCounts.reduce((acc, curr) => (acc + curr.total ? 1 : 0), 0);

    const beatsPerSecond = getBeatsPerMinute(txnCounts[0].lastDay, txnCounts[1].lastWeek);

    const metadata: Metadata = {
        name: `${userName}'s Heartbeat`,
        description: desc(networkCount, beatsPerSecond),
        image: `https://${WEBSITE_URL}/growing.png`,
        externalUrl: `https://${WEBSITE_URL}/heart/${tokenId}`,
        animationUrl: `https://${WEBSITE_URL}/view/${tokenId}`,
        address: minterAddress,
        networkCount,
        beatsPerSecond,
        txnCounts,
    };

    return metadata;
}

export function updateMetadata(
    oldMetadata: Metadata,
    txnCounts: TxnCounts[], // update
    userName: string,
): Metadata {
    const networkCount = txnCounts.reduce((acc, curr) => (acc + curr.total ? 1 : 0), 0);

    const beatsPerSecond = getBeatsPerMinute(txnCounts[0].lastDay, txnCounts[1].lastWeek);

    const metadata: Metadata = {
        ...oldMetadata,
        name: `${userName}'s Heartbeat`,
        description: desc(networkCount, beatsPerSecond),
        networkCount,
        beatsPerSecond,
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
