import mql from '@microlink/mql';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('hello');
    const url = `https://dev.tokengarden.art/viewer`;

    const { status, data, response } = await mql(url, {
        screenshot: true,
    });
    console.log(data);

    const imgdataResponse = await fetch(data.screenshot.url);
    const imgdata = await imgdataResponse.buffer();

    // fs.writeFileSync('test.png', imgdata);
    res.setHeader('Content-Type', 'image/jpg');
    res.send(imgdata);
}
