import type { NextApiRequest, NextApiResponse } from 'next';

import { isValidEventForwarderSignature } from '@utils';
import { addOrUpdateNft } from '@utils/addOrUpdateNft';
import { LogData, logError, logSuccess } from '@utils/logging';
import { addressMap } from '@utils/testAddresses';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        // logger.error({ error }); TODO
        return res.status(400).send({ error });
    }

    const { minterAddress, tokenId } = req.body;
    const forceScreenshot = req.body.forceScreenshot ? req.body.forceScreenshot : false;
    let address: string = minterAddress.toLowerCase();

    const logData: LogData = {
        level: 'info',
        function_name: 'newTransaction',
        message: `begin`,
        token_id: tokenId,
        wallet_address: address,
    };

    if (process.env.VERCEL_ENV !== 'production') {
        address = addressMap[tokenId.toString()];
    }

    const { statusCode, message, error, result } = await addOrUpdateNft(
        address,
        tokenId,
        forceScreenshot,
    );

    if (statusCode !== 200) {
        logError(logData, error);
        return res.status(statusCode).send({ error });
    } else {
        logSuccess(logData);
        res.status(statusCode).send({
            status: statusCode === 200 ? 1 : 0,
            message,
            result,
        });
    }
}
