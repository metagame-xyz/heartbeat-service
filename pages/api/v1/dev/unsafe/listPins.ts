import type { NextApiRequest, NextApiResponse } from 'next';

import { listIPFSPins } from '@utils/ipfs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const pins = await listIPFSPins();

    res.send(pins);
}
