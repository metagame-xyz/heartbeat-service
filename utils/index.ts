import { createHmac } from 'crypto';
import { ethers } from 'ethers';
import Redis from 'ioredis';
import type { NextApiRequest } from 'next';
import fetch from 'node-fetch-retry';
import pino from 'pino';
import { logflarePinoVercel } from 'pino-logflare';

import {
    ETHERSCAN_API_KEY,
    EVENT_FORWARDER_AUTH_TOKEN,
    LOGFLARE_API_KEY,
    LOGFLARE_SOURCE_UUID,
    networkStrings,
    REDIS_URL,
} from './constants';

const fetchOptions = {
    retry: 12,
    pause: 2000,
    callback: (retry: any) => {
        logger.warn(`Retrying: ${retry}`);
    },
};

export const fetcher = (url: string) => fetch(url, fetchOptions).then((r: any) => r.json());

export const isValidEventForwarderSignature = (request: NextApiRequest) => {
    const token = EVENT_FORWARDER_AUTH_TOKEN;
    const headers = request.headers;
    const signature = headers['x-event-forwarder-signature'];
    const body = request.body;
    const hmac = createHmac('sha256', token); // Create a HMAC SHA256 hash using the auth token
    hmac.update(JSON.stringify(body), 'utf8'); // Update the token hash with the request body using utf8
    const digest = hmac.digest('hex');
    return signature === digest;
};

export const checkSignature = (message: string, joinedSignature: string, walletAddress: string) => {
    const digest = ethers.utils.id(message);
    const signature = ethers.utils.splitSignature(joinedSignature);
    const recoveredAddress = ethers.utils.recoverAddress(digest, signature);
    return walletAddress === recoveredAddress;
};

export const ioredisClient = new Redis(REDIS_URL);

// create pino-logflare console stream for serverless functions
const { stream } = logflarePinoVercel({
    apiKey: LOGFLARE_API_KEY,
    sourceToken: LOGFLARE_SOURCE_UUID,
});

// create pino loggger
export const logger = pino(
    {
        base: {
            env: process.env.VERCEL_ENV || 'unknown-env',
            revision: process.env.VERCEL_GITHUB_COMMIT_SHA,
        },
    },
    stream,
);

export const localLogger = pino({}, stream);

export const tsToMonthAndYear = (ts: number): string => {
    const date = new Date(ts * 1000);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export const formatDateObjToTime = (dateObj: Record<string, number>): string => {
    const { hour, minute, second } = dateObj;
    const ampm = hour >= 12 ? 'pm' : 'am';
    let ampmHour = hour % 12;
    ampmHour = ampmHour ? ampmHour : 12; // the hour '0' should be '12'
    const minuteStr = minute < 10 ? '0' + minute : minute;
    const secondStr = second < 10 ? '0' + second : second;
    return `${ampmHour}:${minuteStr}:${secondStr} ${ampm}`;
};

export const getUserName = async (provider, address) => {
    let ensName = null;
    try {
        ensName = await provider.lookupAddress(address);
    } catch (error) {
        logger.error({ error });
        logger.error({ message: 'ensName lookup failed' });
    }
    return ensName || address.substr(0, 6);
};

type NFTMintData = {
    name?: string;
    symbol: string;
    count: number;
    creator?: string;
};

export type Metadata = {
    name: string;
    description: string;
    image: string; // 
    external_url: string; // tokengarden.art/garden/[tokenId]
    address: string;
    uniqueNFTCount: number;
    totalNFTCount: number;
    NFTs: Array<NFTMintData>;
};

// birthblock.art/api/v1/metadata/[tokenId]
export type OpenSeaMetadata = {
    name: string;
    description: string;
    image: string; // birthblock.art/api/v1/image/[tokenId]
    external_url: string; // birthblock.art/birthblock/[tokenId]
    attributes: [
        // properties
        {
            trait_type: 'address';
            value: string;
        },
    ];
};

export function metadataToOpenSeaMetadata(metadata: Metadata): OpenSeaMetadata {
    const openseaMetadata: OpenSeaMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        external_url: metadata.external_url,
        attributes: [
            // properties
            {
                trait_type: 'address',
                value: metadata.address,
            },
        ],
    };

    return openseaMetadata;
}
