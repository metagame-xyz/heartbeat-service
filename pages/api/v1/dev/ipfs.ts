import type { NextApiRequest, NextApiResponse } from 'next';

import { addToIPFS } from '@utils/ipfs';

const url = 'https://www.birthblock.art/site-preview.png';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('hello');

    const path = await addToIPFS(url);

    res.send({ path });
}
