import { getDefaultProvider } from '@ethersproject/providers';
import { createHmac } from 'crypto';
import { ethers } from 'ethers';
import Redis from 'ioredis';
import type { NextApiRequest } from 'next';
import fetch from 'node-fetch-retry';
import pino from 'pino';
import { logflarePinoVercel } from 'pino-logflare';

import {
    ALCHEMY_NOTIFY_TOKEN,
    ALCHEMY_PROJECT_ID,
    EVENT_FORWARDER_AUTH_TOKEN,
    INFURA_PROJECT_ID,
    LOGFLARE_API_KEY,
    LOGFLARE_SOURCE_UUID,
    networkStrings,
    OPENSEA_API_KEY,
    POCKET_NETWORK_API_KEY,
    POCKET_NETWORK_ID,
    REDIS_URL,
} from './constants';

export const defaultProvider = getDefaultProvider(networkStrings.ethers, {
    infura: INFURA_PROJECT_ID,
    alchemy: ALCHEMY_PROJECT_ID,
    pocket: {
        applicationId: POCKET_NETWORK_ID,
        applicationSecretKey: POCKET_NETWORK_API_KEY,
    },
});

export const defaultMainnetProvider = getDefaultProvider('homestead', {
    infura: INFURA_PROJECT_ID,
    alchemy: ALCHEMY_PROJECT_ID,
    pocket: {
        applicationId: POCKET_NETWORK_ID,
        applicationSecretKey: POCKET_NETWORK_API_KEY,
    },
});

const fetchOptions = {
    retry: 12,
    pause: 2000,
    callback: (retry: any) => {
        logger.warn(`Retrying: ${retry}`);
    },
    body: null,
};

export const openseaFetchOptions = {
    ...fetchOptions,
    headers: {
        'X-API-KEY': OPENSEA_API_KEY,
    },
};

export class FetcherError extends Error {
    status: any;
    statusText: any;
    url: any;
    bodySent: any;
    constructor({ message, status, statusText, url, bodySent }) {
        super(message);
        this.name = 'Fetcher Error';
        this.status = status;
        this.statusText = statusText;
        this.url = url;
        this.bodySent = bodySent;
    }
    toJSON() {
        return {
            name: this.name,
            status: this.status,
            statusText: this.statusText,
            url: this.url,
            bodySent: this.bodySent,
        };
    }
}

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function fetcher(url: string, options = fetchOptions) {
    let retry = 3;
    while (retry > 0) {
        const response = await fetch(url, options);
        if (response.ok) {
            return response.json();
        } else {
            const error = {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                bodySent: options.body ? JSON.parse(options.body) : null,
                message: await response.text(),
            };
            logger.error(error); // TODO logflare and slack?
            retry--;
            if (retry === 0) {
                throw new FetcherError(error);
            }
            await sleep(2000);
        }
    }
}

// export const fetcher = (url: string) => fetch(url, fetchOptions).then((r: any) => r.json());

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

export const isValidAlchemySignature = (request: NextApiRequest) => {
    if (process.env.VERCEL_ENV !== 'production') {
        return true;
    }
    const token = ALCHEMY_NOTIFY_TOKEN;
    const headers = request.headers;
    const signature = headers['x-alchemy-signature'] || 'no signature';
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

class LocalLogger {
    info(message: any) {
        console.log(message);
    }
    error(message: any) {
        // TODOD schematize this to an object, error & message maybe?
        console.error(message);
    }
    warn(message: any) {
        console.warn(message);
    }
}

// create pino loggger
export const logger =
    process.env.NODE_ENV === 'production'
        ? pino(
              {
                  base: {
                      env: process.env.VERCEL_ENV || 'unknown-env',
                      revision: process.env.VERCEL_GITHUB_COMMIT_SHA,
                  },
              },
              stream,
          )
        : new LocalLogger();

export const tsToMonthAndYear = (ts: number): string => {
    const date = ts ? new Date(ts * 1000) : new Date();
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

export function openseaGetAssetURL(tokenId, contractAddress, forceUpdate = false, mainnet = null) {
    const networkString = mainnet ? 'api.' : networkStrings.openseaAPI;
    const forceUpdateString = forceUpdate ? '/?forceUpdate=true' : '';
    return `https://${networkString}opensea.io/api/v1/asset/${contractAddress}/${tokenId}${forceUpdateString}`;
}
