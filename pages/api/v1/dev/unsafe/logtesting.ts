import type { NextApiRequest, NextApiResponse } from 'next';

import { debug, LogData, logError, logger, logSuccess } from '@utils/logging';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const logData = {
        level: 'info',
        token_id: '1',
        attempt_number: 40,
        third_party_name: 'opensea',
        function_name: 'screenshot',
        message: 'asdf',
    };

    logger.log(logData);
    // debug(logData);

    res.send({});
}
