import type { NextApiRequest, NextApiResponse } from 'next';

import { addOrUpdateNft } from '@utils/addOrUpdateNft';
import { LogData, logError, logSuccess } from '@utils/logging';
import { getAddressForTokenId } from '@utils/metadata';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { tokenId } = req.query;
    const tokenIdString: string = Array.isArray(tokenId) ? tokenId[0] : tokenId;

    const logData: LogData = {
        level: 'info',
        function_name: 'updateDB',
        message: `begin`,
        token_id: tokenIdString,
    };

    try {
        const address = await getAddressForTokenId(tokenIdString);
        const response = await addOrUpdateNft(address, tokenIdString);

        logSuccess(logData);
        res.send(response);
    } catch (error) {
        logError(logData, error);
        return res.status(500).send({ error });
    }
    // res.send({});
}
