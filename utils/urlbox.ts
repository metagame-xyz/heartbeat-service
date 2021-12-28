import Urlbox from 'urlbox';

import { logger } from '@utils';

import { doneDivClass, URL_BOX_API_SECRET, URLBOX_API_KEY } from './constants';

export async function activateUrlbox(tokenId, totalNFTCount, timer = false): Promise<string> {
    const url = `https://dev.tokengarden.art/privateGarden/${tokenId}`; //TODO un-hardcode

    const urlbox = Urlbox(URLBOX_API_KEY, URL_BOX_API_SECRET);
    const baseOptions = {
        url,
        unique: ''.concat(tokenId, '-', totalNFTCount),
        format: 'jpg',
        quality: 100,
        width: 2048,
        height: 2048,
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
