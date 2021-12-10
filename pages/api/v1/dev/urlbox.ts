import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import Urlbox from 'urlbox';

import { URL_BOX_API_SECRET, URLBOX_API_KEY } from '@utils/constants';

import ScreenshotQueue from '../queues/screenshot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('hello');

    const tokenId = '2';
    const url = `https://dev.tokengarden.art/garden/${tokenId}`;
    const urlbox = Urlbox(URLBOX_API_KEY, URL_BOX_API_SECRET);

    // Set your options
    const options = {
        url,
        format: 'png',
        quality: 100,
        full_page: true,
        force: true,
        wait_for: '.gui',
        fail_if_selector_missing: true,
    };

    const imgUrl = urlbox.buildUrl(options);
    console.log(imgUrl);

    const startTime = performance.now();
    fetch(imgUrl);
    const duration = performance.now() - startTime;
    console.log(`Duration: ${duration / 1000} seconds`);

    const jobData = await ScreenshotQueue.enqueue(
        {
            url: imgUrl,
            tokenId,
        },
        {
            delay: '1m',
        },
    );
    console.log(jobData);
    // const imgdata = await imgdataResponse.buffer();

    // const img = await
    // fs.writeFileSync('test.png', imgdata);
    res.setHeader('Content-Type', 'application/json');
    res.send({ ok: 'ok' });
}
