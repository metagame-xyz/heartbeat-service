import type { NextApiRequest, NextApiResponse } from 'next';

import { ioredisClient } from '@utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { tokenId } = req.query;
    const tokenIdString: string = Array.isArray(tokenId) ? tokenId[0] : tokenId;

    const metadata = await ioredisClient.hget(tokenIdString.toLowerCase(), 'metadata');
    await ioredisClient.hset('homepageData', 'metadata', metadata);

    res.send(JSON.parse(metadata));
}
