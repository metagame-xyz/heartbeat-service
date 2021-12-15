import Urlbox from 'urlbox';

import { URL_BOX_API_SECRET, URLBOX_API_KEY, doneDivClass } from './constants';

export function activateUrlbox(tokenId): string {
    const url = `https://dev.tokengarden.art/privateGarden/${tokenId}`; //TODO un-hardcode

    const urlbox = Urlbox(URLBOX_API_KEY, URL_BOX_API_SECRET);
    const baseOptions = {
        url,
        format: 'png',
        quality: 100,
    };

    // force and wait for the image to load
    const optionsWithForce = {
        ...baseOptions,
        full_page: true,
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
