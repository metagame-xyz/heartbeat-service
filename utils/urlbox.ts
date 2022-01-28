import { ioredisClient } from '@utils';
import { LogData, logError, logSuccess } from '@utils/logging';

import {
    doneDivClass,
    EVENT_FORWARDER_AUTH_TOKEN,
    EVENT_FORWARDER_AUTH_TOKEN_HEADER,
    INFURA_IPFS_PROJECT_ID,
    INFURA_IPFS_PROJECT_ID_HEADER,
    INFURA_IPFS_SECRET,
    INFURA_IPFS_SECRET_HEADER,
    URL_BOX_API_SECRET,
} from './constants';
import { fetcher } from './requests';

export async function setTokenIdByRenderId(renderId: string, tokenId: string): Promise<void> {
    await ioredisClient.hset(renderId, 'tokenId', tokenId);
}

export async function getTokenIdByRenderId(renderId: string): Promise<string> {
    const tokenId = await ioredisClient.hget(renderId, 'tokenId');

    if (!tokenId) {
        throw new Error(`tokenId for renderId ${renderId} not found`);
    }

    return tokenId.toString();
}

export async function generateGIFWithUrlbox(tokenId: string, timer = false): Promise<any> {
    const env = process.env.VERCEL_ENV === 'production' ? 'heartbeat' : 'heartbeat-dev';
    const url = `https://${env}.themetagame.xyz/generateGif/${tokenId}`;
    const loggerUrl = `https://${env}.themetagame.xyz/api/v1/webhooks/urlboxLogger`;

    // const urlbox = Urlbox(URLBOX_API_KEY, URL_BOX_API_SECRET);
    const baseParams = {
        url: url,
        unique: tokenId,
        width: 512,
        height: 512,
        // gpu: true,
        wait_for: `.${doneDivClass}`,
        wait_timeout: 180_000,
        fail_if_selector_missing: true,
        header: [
            `${INFURA_IPFS_PROJECT_ID_HEADER}=${INFURA_IPFS_PROJECT_ID}`,
            `${INFURA_IPFS_SECRET_HEADER}=${INFURA_IPFS_SECRET}`,
            `${EVENT_FORWARDER_AUTH_TOKEN_HEADER}=${EVENT_FORWARDER_AUTH_TOKEN}`,
        ],
        webhook_url: loggerUrl,
    };

    // force and wait for the image to load
    const paramsWithForce = {
        ...baseParams,
        force: true,
    };

    const urlboxOptions = {
        method: 'POST',
        body: JSON.stringify(paramsWithForce),
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${URL_BOX_API_SECRET}`,
        },
    };

    const urlboxPostUrl = `https://api.urlbox.io/v1/render`;

    const logData: LogData = {
        level: 'info',
        token_id: tokenId,
        function_name: 'generateGIFWithUrlbox',
    };
    let response;
    try {
        response = await fetcher(urlboxPostUrl, urlboxOptions);
        const renderId = response.renderId;
        await setTokenIdByRenderId(renderId, tokenId);
        // console.log(data);
        // console.log(response.headers);
        logData.extra = response;
        logSuccess(logData);
        return true;
    } catch (error) {
        logError(logData, error);
        throw error;
    }

    // const forceImgUrl = urlbox.buildUrl(paramsWithForce);
    // if (timer && process.env.NODE_ENV !== 'production') {
    //     logger.info(`begin screenshot of ${forceImgUrl}`);
    //     let start = performance.now();
    //     const data = await fetch(forceImgUrl);
    //     let end = performance.now();
    //     logger.info(`fetching image took ${(end - start) / 1000} seconds`);
    //     return data;
    // }

    // const data = await fetch(forceImgUrl, options);
    // return data;
}
