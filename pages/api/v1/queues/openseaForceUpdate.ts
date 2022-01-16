import { Queue } from 'quirrel/next';

import { forceUpdateOpenSeaMetadata } from '@utils';
import { ipfsUrlToCIDString } from '@utils/ipfs';
import { LogData, logError, logSuccess, logWarning } from '@utils/logging';

type Job = {
    tokenId: string;
    attempt: number;
    newImageUrl: string;
};

const attemptToDelay = [
    null,
    '15s',
    '30s',
    '1m',
    '2m',
    '5m',
    '10m',
    '20m',
    '30m',
    '1h',
    '1h',
    '1h',
    '2h',
    '2h',
    '2h',
    '3h',
    '3h',
];

const OpenseaForceUpdate = Queue(
    'api/v1/queues/openseaForceUpdate', // 👈 the route it's reachable on
    async (job: Job) => {
        let { tokenId, attempt, newImageUrl } = job;

        let totalAttempts = attempt;
        const newImageCID = ipfsUrlToCIDString(newImageUrl);

        let message = 'image url is up-to-date';

        const logData: LogData = {
            level: 'info',
            token_id: tokenId,
            attempt_number: totalAttempts,
            third_party_name: 'opensea',
            function_name: 'openseaForceUpdate',
            message,
        };

        try {
            const openseaResult = await forceUpdateOpenSeaMetadata(tokenId);
            const originalImageURL = openseaResult.image_original_url;

            if (!(originalImageURL || '').includes(newImageCID)) {
                const delay = attemptToDelay[attempt];
                message = `${newImageCID} not included in ${originalImageURL}. Waiting ${delay} to try again.`;

                if (delay) {
                    totalAttempts++;
                    const jobData = await OpenseaForceUpdate.enqueue(
                        { tokenId, attempt: totalAttempts, newImageUrl },
                        { delay, id: tokenId, override: true },
                    );

                    logData.job_data = jobData;
                } else {
                    logWarning(logData, 'attempts exhausted. Call OpenSea on the phone');
                }
            }
        } catch (error) {
            logError(logData, error);
        }

        logSuccess(logData, message);
    },
);

export default OpenseaForceUpdate;
