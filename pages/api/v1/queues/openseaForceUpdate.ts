import { Queue } from 'quirrel/next';

import { fetcher, openseaFetchOptions, openseaGetAssetURL } from '@utils';
import { CONTRACT_ADDRESS } from '@utils/constants';
import { LogData, logger } from '@utils/logging';

type Job = {
    tokenId: string;
    attempt: number;
};

const OpenseaForceUpdate = Queue(
    'api/v1/queues/openseaForceUpdate', // 👈 the route it's reachable on
    async (job: Job) => {
        let { tokenId, attempt } = job;

        let totalAttempts = attempt;

        const getAssetUrl = openseaGetAssetURL(tokenId, CONTRACT_ADDRESS);
        const forceUpdateUrl = openseaGetAssetURL(tokenId, CONTRACT_ADDRESS, true);

        let message = 'beggining openseaForceUpdate';
        let thrownError = null;

        try {
            const openseaResult = await fetcher(getAssetUrl, openseaFetchOptions);
            const originalImageURL = openseaResult.image_original_url;
            message = `OpenSea original image url: ${originalImageURL}`;

            if (!(originalImageURL || '').includes('ipfs.io')) {
                const forceResult = await fetcher(forceUpdateUrl, openseaFetchOptions);
                thrownError = forceResult?.error;
                totalAttempts++;
                await OpenseaForceUpdate.enqueue(
                    { tokenId, attempt: totalAttempts },
                    { delay: '15s' },
                );
            }
        } catch (error) {
            thrownError = error;
        } finally {
            const logData: LogData = {
                level: thrownError ? 'error' : 'info',
                token_id: tokenId,
                attempt_number: totalAttempts,
                third_party_name: 'opensea',
                function_name: 'openseaForceUpdate',
                message,
            };
            thrownError ? (logData.thrown_error = thrownError) : null;
            logger.log(logData);
        }
    },
);

export default OpenseaForceUpdate;
