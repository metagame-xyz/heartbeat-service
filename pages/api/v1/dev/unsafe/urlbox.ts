import type { NextApiRequest, NextApiResponse } from 'next';

import { generateGIFWithUrlbox } from '@utils/urlbox';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const data = await generateGIFWithUrlbox('2', true);

    // res.send(forceImgUrl);
    res.send(data);
}
