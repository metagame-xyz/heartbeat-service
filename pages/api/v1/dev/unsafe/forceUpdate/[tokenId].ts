import type { NextApiRequest, NextApiResponse } from 'next';

import OpenseaForceUpdate from '@api/queues/openseaForceUpdate';

import { ioredisClient } from '@utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { tokenId } = req.query;
    const tokenIdString: string = Array.isArray(tokenId) ? tokenId[0] : tokenId;

    const metadataStr = await ioredisClient.hget(tokenIdString.toLowerCase(), 'metadata');

    if (!metadataStr) {
        return res.status(404).json({ message: `Token id ${tokenId} not found.` });
    }

    const metadata = JSON.parse(metadataStr);

    const jobData = await OpenseaForceUpdate.enqueue({
        tokenId: tokenIdString,
        attempt: 1,
        newImageUrl: metadata.image,
    });
    res.send(jobData);
    // res.send({});
}
