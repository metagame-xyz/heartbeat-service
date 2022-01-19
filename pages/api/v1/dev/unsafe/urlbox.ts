import type { NextApiRequest, NextApiResponse } from 'next';
import Urlbox from 'urlbox';

import {
    doneDivClass,
    INFURA_IPFS_PROJECT_ID,
    INFURA_IPFS_PROJECT_ID_HEADER,
    INFURA_IPFS_SECRET,
    INFURA_IPFS_SECRET_HEADER,
    URL_BOX_API_SECRET,
    URLBOX_API_KEY,
} from '@utils/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const env = process.env.VERCEL_ENV === 'production' ? 'heartbeat' : 'heartbeat-dev';
    const url = `https://${env}.themetagame.xyz/generateGif/${789}`;

    const urlbox = Urlbox(URLBOX_API_KEY, URL_BOX_API_SECRET);
    const baseOptions = {
        url,
        unique: 789,
        format: 'jpg',
        quality: 100,
        width: 1024,
        height: 1024,
        // retina: true,
        gpu: true,
        wait_for: `.${doneDivClass}`,
        fail_if_selector_missing: true,
        header: [
            `${INFURA_IPFS_PROJECT_ID_HEADER}=${INFURA_IPFS_PROJECT_ID}`,
            `${INFURA_IPFS_SECRET_HEADER}=${INFURA_IPFS_SECRET}`,
        ],
    };

    // force and wait for the image to load
    const optionsWithForce = {
        ...baseOptions,
        force: true,
    };

    const forceImgUrl = urlbox.buildUrl(optionsWithForce);

    // res.send(forceImgUrl);
    res.send({});
}
