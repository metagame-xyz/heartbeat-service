import type { NextApiRequest, NextApiResponse } from 'next';

import { LogData, logSuccess } from '@utils/logging';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(404).send({});
    }
    /****************/
    /*     AUTH     */
    /****************/
    // if (!isValidEventForwarderSignature(req)) {
    //     const error = 'invalid event-forwarder Signature';
    //     // logger.error({ error }); TODO
    //     return res.status(403).send({ error });
    // }
    const body = req.body;

    const logData: LogData = {
        level: 'info',
        function_name: 'urlboxLogger',
        extra: body,
    };

    logSuccess(logData);
    return res.status(200).send({});
}
