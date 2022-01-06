import { Queue } from 'quirrel/next';

import { fetcher, logger, openseaFetchOptions, openseaGetAssetURL } from '@utils';
import { CONTRACT_ADDRESS } from '@utils/constants';
import { logger as winstonLogger } from '@utils/logging';

type Job = {
    tokenId: string;
    attempt: number;
};

const OpenseaForceUpdate = Queue(
    'api/v1/queues/openseaForceUpdate', // 👈 the route it's reachable on
    async (job: Job) => {
        let { tokenId, attempt } = job;

        const getAssetUrl = openseaGetAssetURL(tokenId, CONTRACT_ADDRESS);
        const forceUpdateUrl = openseaGetAssetURL(tokenId, CONTRACT_ADDRESS, true);

        const openseaResult = await fetcher(getAssetUrl, openseaFetchOptions);

        const originalImageURL = openseaResult.image_original_url;
        if (!(originalImageURL || '').includes('ipfs.io')) {
            // logger.info(`no ipfs url found for ${tokenId}: ${originalImageURL}`);
            // logger.info(`updating metadata for ${tokenId}. attempt #${attempt}`);
            winstonLogger.info(`winston no ipfs url found for ${tokenId}: ${originalImageURL}`);
            winstonLogger.info(`winston updating metadata for ${tokenId}. attempt #${attempt}`);
            const forceResult = await fetcher(forceUpdateUrl, openseaFetchOptions);
            if (forceResult.error) {
                // logger.info(forceResult);
                winstonLogger.info(forceResult);
            }
            try {
                const totalAttempts = attempt++;
                const jobData = await OpenseaForceUpdate.enqueue(
                    { tokenId, attempt: totalAttempts },
                    { delay: '15s' },
                );
            } catch (error) {
                // logger.error(error);
                winstonLogger.error(error);
            }
        } else {
            // logger.info(`ipfs url found for ${tokenId} on attempt #${attempt}`);
            winstonLogger.info(`winston ipfs url found for ${tokenId} on attempt #${attempt}`);
        }
        if (openseaResult.error) {
            // logger.error(openseaResult);
            winstonLogger.error(openseaResult);
        }
    },
);

export default OpenseaForceUpdate;
