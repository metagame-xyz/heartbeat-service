import type { NextApiRequest, NextApiResponse } from 'next';

import { LogData, logError, logSuccess, logWarning } from '@utils/logging';
import { generateGIFWithUrlbox, getTokenIdByRenderId } from '@utils/urlbox';

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
    const { meta, event, result, error, renderId } = req.body;

    const logData: LogData = {
        level: 'info',
        function_name: 'urlboxLogger',
        extra: req.body,
    };

    const timeElapsed = new Date(meta.endTime).getTime() - new Date(meta.startTime).getTime();
    logData.seconds_elapsed = timeElapsed / 1000;

    let tokenId;
    try {
        tokenId = await getTokenIdByRenderId(renderId);
        logData.token_id = tokenId;
    } catch (error) {
        logError(logData, error);
    }

    if (error) {
        await generateGIFWithUrlbox(tokenId);
        logError(logData, error);
    } else {
        logSuccess(logData);
    }

    return res.send({});
}
