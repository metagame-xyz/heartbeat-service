import { IPFS } from 'ipfs-core-types';
import { create } from 'ipfs-http-client';

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

export function getBeatsPerMinute(txnsInLastDay: number, txnsInLastWeek: number): number {
    return txnsInLastDay || Math.round(txnsInLastWeek / 7); // TODO: fix this
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
