import type { NextApiRequest, NextApiResponse } from 'next';

import { startOpenseaForceUpdateLoop } from '@api/queues/openseaForceUpdate';

import { isValidEventForwarderSignature } from '@utils';
import { clickableIPFSLink, UpdateImageBody } from '@utils/frontend';
import { removeFromIPFS } from '@utils/ipfs';
import { LogData, logError, logSuccess, logWarning } from '@utils/logging';
import { getMetadata, Metadata, updateMetadata } from '@utils/metadata';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(404).send({});
    }
    /****************/
    /*     AUTH     */
    /****************/
    if (!isValidEventForwarderSignature(req)) {
        const error = 'invalid event-forwarder Signature';
        // logger.error({ error }); TODO
        return res.status(403).send({ error });
    }

    const { tokenId, ipfsUrl, secondsElapsed } = req.body as UpdateImageBody;

    const logData: LogData = {
        level: 'info',
        function_name: 'updateImage',
        message: `begin`,
        token_id: tokenId,
        seconds_elapsed: secondsElapsed,
    };

    try {
        logData.third_party_name = 'redis';
        const oldMedata = await getMetadata(tokenId);

        logData.wallet_address = oldMedata.address;

        const metadata: Metadata = {
            ...oldMedata,
            image: ipfsUrl,
        };

        await updateMetadata(metadata, tokenId, oldMedata.address);

        if (metadata.image.includes('ipfs://') && metadata.image !== oldMedata.image) {
            try {
                logData.third_party_name = 'ipfs_remove';
                await removeFromIPFS(metadata.image);
            } catch (error) {
                if (error.message.includes('not pinned or pinned indirectly')) {
                    logWarning(logData, error.message);
                } else {
                    throw error;
                }
            }
        }

        logData.third_party_name = 'queue';
        const jobData = await startOpenseaForceUpdateLoop(tokenId, ipfsUrl);

        logData.job_data = jobData;

        logSuccess(logData, clickableIPFSLink(ipfsUrl));
        return res.status(200).send({});
    } catch (error) {
        logError(logData, error);
        return res.status(500).send({ error });
    }
}
