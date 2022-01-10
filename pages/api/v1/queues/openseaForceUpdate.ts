import { Queue } from 'quirrel/next';

import { fetcher, openseaFetchOptions, openseaGetAssetURL } from '@utils';
import { CONTRACT_ADDRESS } from '@utils/constants';
import { ipfsUrlToCIDString } from '@utils/ipfs';
import { LogData, logError, logger, logSuccess } from '@utils/logging';

type Job = {
    tokenId: string;
    attempt: number;
    newImageUrl: string;
};

const OpenseaForceUpdate = Queue(
    'api/v1/queues/openseaForceUpdate', // 👈 the route it's reachable on
    async (job: Job) => {
        let { tokenId, attempt, newImageUrl } = job;

        let totalAttempts = attempt;
        const newImageCID = ipfsUrlToCIDString(newImageUrl);

        const getAssetUrl = openseaGetAssetURL(tokenId, CONTRACT_ADDRESS);
        const forceUpdateUrl = openseaGetAssetURL(tokenId, CONTRACT_ADDRESS, true);

        let message = 'beggining openseaForceUpdate';
        let thrownError = null;

        const logData: LogData = {
            level: thrownError ? 'error' : 'info',
            token_id: tokenId,
            attempt_number: totalAttempts,
            third_party_name: 'opensea',
            function_name: 'openseaForceUpdate',
            message,
        };

        try {
            const openseaResult = await fetcher(getAssetUrl, openseaFetchOptions);
            const originalImageURL = openseaResult.image_original_url;
            message = `${newImageCID} included in ${originalImageURL}. No retry needed.`;

            if (!(originalImageURL || '').includes(newImageCID)) {
                message = `${newImageCID} not included in ${originalImageURL}. Queueing again.`;
                await fetcher(forceUpdateUrl, openseaFetchOptions);
                totalAttempts++;
                await OpenseaForceUpdate.enqueue(
                    { tokenId, attempt: totalAttempts, newImageUrl },
                    { delay: '15s', id: tokenId },
                );
            }
        } catch (error) {
            logError(logData, error);
        }

        logSuccess(logData, message);
    },
);

export default OpenseaForceUpdate;
