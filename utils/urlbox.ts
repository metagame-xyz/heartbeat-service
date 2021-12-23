import Urlbox from 'urlbox';

import { doneDivClass, URL_BOX_API_SECRET, URLBOX_API_KEY } from './constants';

export function activateUrlbox(tokenId): string {
    const url = `https://dev.tokengarden.art/privateGarden/${tokenId}`; //TODO un-hardcode

    const urlbox = Urlbox(URLBOX_API_KEY, URL_BOX_API_SECRET);
    const baseOptions = {
        url,
        format: 'jpg',
        quality: 100,
        full_page: true,
        retina: true,
    };

    // force and wait for the image to load
    const optionsWithForce = {
        ...baseOptions,
        force: true,
        wait_for: `.${doneDivClass}`,
        fail_if_selector_missing: true,
    };

    const forceImgUrl = urlbox.buildUrl(optionsWithForce);
    const imgUrl = urlbox.buildUrl(baseOptions);

    // send and forget
    fetch(forceImgUrl);

    return imgUrl;
}
