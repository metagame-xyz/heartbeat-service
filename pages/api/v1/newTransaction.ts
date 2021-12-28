import type { NextApiRequest, NextApiResponse } from 'next';

import { isValidEventForwarderSignature, logger } from '@utils';
import { addOrUpdateNft } from '@utils/addOrUpdateNft';
import { addressMap } from '@utils/testAddresses';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    logger.info(`top of newTransaction for tokenId ${req.body.tokenId}`);
    if (req.method !== 'POST') {
        /**
         * During development, it's useful to un-comment this block
         * so you can test some of your code by just hitting this page locally
         *
         */

        const minterAddress = '0x3B3525F60eeea4a1eF554df5425912c2a532875D';
        const tokenId = '1';

        const metadata = {};
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(metadata);
    }

    /****************/
    /*     AUTH     */
    /****************/
    if (!isValidEventForwarderSignature(req)) {
        const error = 'invalid event-forwarder Signature';
        logger.error({ error });
        return res.status(400).send({ error });
    }

    const { minterAddress, tokenId } = req.body;
    let address: string = minterAddress.toLowerCase();

    if (process.env.VERCEL_ENV !== 'production') {
        address = addressMap[tokenId.toString()];
    }

    const { statusCode, message, error, result } = await addOrUpdateNft(address, tokenId);

    if (statusCode !== 200) {
        logger.error(message);
        return res.status(statusCode).send({ error });
    } else {
        res.status(statusCode).send({
            status: statusCode === 200 ? 1 : 0,
            message,
            result,
        });
    }
}
