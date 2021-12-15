import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import Urlbox from 'urlbox';

import { logger } from '@utils';
import { doneDivClass, URL_BOX_API_SECRET, URLBOX_API_KEY } from '@utils/constants';

import ScreenshotQueue from '../../../queues/screenshot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { tokenId } = req.query;
    const tokenIdString: string = Array.isArray(tokenId) ? tokenId[0] : tokenId;

    const url = `https://dev.tokengarden.art/garden/${tokenIdString}`;
    const urlbox = Urlbox(URLBOX_API_KEY, URL_BOX_API_SECRET);

    const baseOptions = {
        url,
        format: 'png',
        quality: 100,
    };
    // Set your options
    const optionsWithForce = {
        ...baseOptions,
        full_page: true,
        force: true,
        wait_for: `.${doneDivClass}`,
        fail_if_selector_missing: true,
    };

    const forceImgUrl = urlbox.buildUrl(optionsWithForce);
    const imgUrl = urlbox.buildUrl(baseOptions);

    fetch(forceImgUrl);

    logger.info(imgUrl);

    logger.info(`Quirrel base url: ${process.env.QUIRREL_BASE_URL}`);

    try {
        const jobData = await ScreenshotQueue.enqueue(
            {
                url: imgUrl,
                tokenId: tokenIdString,
            },
            {
                delay: '1m',
            },
        );
        logger.info(jobData);
    } catch (error) {
        logger.error(error);
    }
    // const imgdata = await imgdataResponse.buffer();

    // const img = await
    // fs.writeFileSync('test.png', imgdata);
    res.setHeader('Content-Type', 'application/json');
    res.send({ ok: 'ok' });
}
