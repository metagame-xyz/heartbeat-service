import { createHmac } from 'crypto';
import { IPFS } from 'ipfs-core-types';
import { create } from 'ipfs-http-client';

import { WEBSITE_URL } from './constants';
import { TxnCounts } from './metadata';

export function getTruncatedAddress(address: string): string {
    if (address && address.startsWith('0x')) {
        return address.substr(0, 4) + '...' + address.substr(address.length - 4);
    }
    return address;
}

export function debug(varObj: object): void {
    Object.keys(varObj).forEach((str) => {
        console.log(`${str}:`, varObj[str]);
    });
}

export const event = (action: string, params?: Object) => {
    window.gtag('event', action, params);
};

export type EventParams = {
    network?: string;
    buttonLocation?: string;
    connectionType?: string;
    connectionName?: string;
    errorReason?: string;
    errorMessage?: string;
};

export function getBeatsPerMinute(txnCounts: TxnCounts): number {
    const ethWeek = txnCounts.ethereum.transactionsLastWeek;
    const polygonWeek = txnCounts.polygon.transactionsLastWeek;
    const fantomWeek = txnCounts.fantom.transactionsLastWeek;
    const avalancheWeek = txnCounts.avalanche.transactionsLastWeek;

    const MAX_BEATS = 144;
    const sidechainAverage = (polygonWeek + fantomWeek + avalancheWeek) / 3;

    const sidechainMax = 144;
    const ethMax = 48;

    const sidechainScore = Math.min(1, sidechainAverage / sidechainMax);
    const ethScore = Math.min(1, ethWeek / ethMax);

    const sidechainBeats = sidechainScore * MAX_BEATS;
    const ethBeats = ethScore * MAX_BEATS;

    return Math.max(sidechainBeats, ethBeats);
}

export function createIPFSClient(INFURA_IPFS_PROJECT_ID: string, INFURA_IPFS_SECRET: string): IPFS {
    const auth =
        'Basic ' +
        Buffer.from(INFURA_IPFS_PROJECT_ID + ':' + INFURA_IPFS_SECRET).toString('base64');

    const client = create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
            authorization: auth,
        },
    });

    return client;
}

const gatewayURL = 'https://ipfs.infura.io/ipfs/';
const ipfsScheme = 'ipfs://';
export const ipfsUrlToCIDString = (url: string): string => {
    return url.replace(ipfsScheme, '');
};

export const clickableIPFSLink = (ipfsURL: string): string => {
    return ipfsURL.replace(ipfsScheme, gatewayURL);
};

export const addBlobToIPFS = async (client: IPFS, blob: Blob): Promise<string> => {
    const file = await client.add(blob);
    return ipfsScheme + file.path;
};

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const signMessage = (body, token) => {
    const hmac = createHmac('sha256', token); // Create a HMAC SHA256 hash using the auth token
    hmac.update(JSON.stringify(body), 'utf8'); // Update the token hash with the request body using utf8
    const digest = hmac.digest('hex');
    return digest;
};

const updateImageFetchOptions = (
    EVENT_FORWARDER_AUTH_TOKEN: string,
    body: { ipfsUrl: string },
) => ({
    method: 'post',
    body: JSON.stringify(body),
    headers: {
        'content-type': 'application/json',
        'x-event-forwarder-signature': signMessage(body, EVENT_FORWARDER_AUTH_TOKEN),
    },
});

async function fetcher(url: string, options) {
    let retry = 3;
    while (retry > 0) {
        const response: Response = await fetch(url, options);
        if (response.ok) {
            return response.json() as Promise<any>;
        } else {
            retry--;
            if (retry === 0) {
                throw new Error(`Failed to fetch ${url}`);
            }
            await sleep(2000);
        }
    }
}

export type UpdateImageBody = {
    ipfsUrl: string;
    tokenId: string;
    secondsElapsed: number;
};

export async function updateImage(
    tokenId: string,
    ipfsUrl: string,
    EVENT_FORWARDER_AUTH_TOKEN: string,
    secondsElapsed: number,
) {
    const body: UpdateImageBody = {
        ipfsUrl,
        tokenId,
        secondsElapsed,
    };
    const options = updateImageFetchOptions(EVENT_FORWARDER_AUTH_TOKEN, body);
    const url = `https://${WEBSITE_URL}/api/v1/updateImage`;
    const response = await fetcher(url, options);
    return response;
}
