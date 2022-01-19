import type { NextApiRequest, NextApiResponse } from 'next';

import { isValidEventForwarderSignature } from '@utils';
import { addOrUpdateNft } from '@utils/addOrUpdateNft';
import { LogData, logError, logSuccess } from '@utils/logging';
import { addressMap } from '@utils/testAddresses';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(404).send({});
    }

    /****************/
    /*     AUTH     */
    /****************/
    if (!isValidEventForwarderSignature(req)) {
        const error = 'invalid event-forwarder Signature';
        return res.status(403).send({ error });
    }

    const { minterAddress, tokenId } = req.body;
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

    const { statusCode, message, error, result } = await addOrUpdateNft(address, tokenId);

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
