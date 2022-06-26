import type { NextApiRequest, NextApiResponse } from 'next';

import { THE_METAGAME_ETH_ADDRESS, WEBSITE_URL } from '@utils/constants';
import { copy } from '@utils/content';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const metadata = {
        name: copy.title,
        description: `${copy.heroSubheading}. <br><br> Part of **Metagame**. Follow along on twitter [@Metagame](https://twitter.com/metagame). Mint one via [themetagame.xyz](https://www.themetagame.xyz) `,
        image: `https://${WEBSITE_URL}/logo.png`,
        external_link: `https://${WEBSITE_URL}`,
        seller_fee_basis_points: 800, // 8%,
        fee_recipient: THE_METAGAME_ETH_ADDRESS,
    };

    res.send(metadata);
}
