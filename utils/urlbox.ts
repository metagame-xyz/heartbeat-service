import Urlbox from 'urlbox';

import { logger, logSuccess } from '@utils/logging';

import {
    doneDivClass,
    EVENT_FORWARDER_AUTH_TOKEN,
    EVENT_FORWARDER_AUTH_TOKEN_HEADER,
    INFURA_IPFS_PROJECT_ID,
    INFURA_IPFS_PROJECT_ID_HEADER,
    INFURA_IPFS_SECRET,
    INFURA_IPFS_SECRET_HEADER,
    URL_BOX_API_SECRET,
    URLBOX_API_KEY,
} from './constants';

export async function generateGIFWithUrlbox(tokenId: string, timer = false): Promise<any> {
    const env = process.env.VERCEL_ENV === 'production' ? 'heartbeat' : 'heartbeat-dev';
    const url = `https://${env}.themetagame.xyz/generateGif/${tokenId}`;

    const urlbox = Urlbox(URLBOX_API_KEY, URL_BOX_API_SECRET);
    const baseOptions = {
        url,
        unique: tokenId,
        width: 512,
        height: 512,
        gpu: true,
        wait_for: `.${doneDivClass}`,
        fail_if_selector_missing: true,
        header: [
            `${INFURA_IPFS_PROJECT_ID_HEADER}=${INFURA_IPFS_PROJECT_ID}`,
            `${INFURA_IPFS_SECRET_HEADER}=${INFURA_IPFS_SECRET}`,
            `${EVENT_FORWARDER_AUTH_TOKEN_HEADER}=${EVENT_FORWARDER_AUTH_TOKEN}`,
        ],
    };

    // force and wait for the image to load
    const optionsWithForce = {
        ...baseOptions,
        force: true,
    };

    const forceImgUrl = urlbox.buildUrl(optionsWithForce);

    logSuccess(
        {
            level: 'info',
            token_id: tokenId,
            function_name: 'generateGIFWithUrlbox',
        },
        `forceImgUrl: ${forceImgUrl}`,
    );

    if (timer && process.env.NODE_ENV !== 'production') {
        logger.info(`begin screenshot of ${forceImgUrl}`);
        let start = performance.now();
        const data = await fetch(forceImgUrl);
        let end = performance.now();
        logger.info(`fetching image took ${(end - start) / 1000} seconds`);
        return data;
    }

    await fetch(forceImgUrl);
    return true;
}
