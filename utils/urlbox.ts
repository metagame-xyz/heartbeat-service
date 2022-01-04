import Urlbox from 'urlbox';

import { logger } from '@utils';

import { doneDivClass, URL_BOX_API_SECRET, URLBOX_API_KEY } from './constants';

export async function activateUrlbox(tokenId, totalNFTCount, timer = false): Promise<string> {
    const env = process.env.VERCEL_ENV === 'production' ? 'www' : 'dev';
    const url = `https://${env}.tokengarden.art/privateGarden/${tokenId}`;

    const urlbox = Urlbox(URLBOX_API_KEY, URL_BOX_API_SECRET);
    const baseOptions = {
        url,
        unique: ''.concat(tokenId, '-', totalNFTCount),
        format: 'jpg',
        quality: 100,
        width: 1024,
        height: 1024,
        // retina: true,
        gpu: true,
        wait_for: `.${doneDivClass}`,
        fail_if_selector_missing: true,
    };

    // force and wait for the image to load
    const optionsWithForce = {
        ...baseOptions,
        force: true,
    };

    const forceImgUrl = urlbox.buildUrl(optionsWithForce);
    const imgUrl = urlbox.buildUrl(baseOptions);

    if (timer && process.env.NODE_ENV !== 'production') {
        logger.info(`begin screenshot of ${imgUrl}`);
        logger.info(`force URL: ${forceImgUrl}`);
        let start = performance.now();
        const data = await fetch(forceImgUrl);
        let end = performance.now();
        logger.info(`fetching image took ${(end - start) / 1000} seconds`);
        logger.info(data);
        return imgUrl;
    }

    // send and forget
    fetch(forceImgUrl);

    return imgUrl;
}
