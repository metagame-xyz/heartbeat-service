import type { NextApiRequest, NextApiResponse } from 'next';

import { generateGIFWithUrlbox } from '@utils/urlbox';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { tokenId } = req.query;
    const tokenIdString: string = Array.isArray(tokenId) ? tokenId[0] : tokenId;

    const data = await generateGIFWithUrlbox(tokenIdString, true);
    res.send(data);
}
