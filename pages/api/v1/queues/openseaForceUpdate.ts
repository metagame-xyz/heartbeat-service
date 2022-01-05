import { Queue } from 'quirrel/next';

import { fetcher, logger, openseaFetchOptions, openseaGetAssetURL } from '@utils';
import { CONTRACT_ADDRESS } from '@utils/constants';

type Job = {
    tokenId: string;
};

const OpenseaForceUpdate = Queue(
    'api/v1/queues/openseaForceUpdate', // 👈 the route it's reachable on
    async (job: Job) => {
        const { tokenId } = job;

        const getAssetUrl = openseaGetAssetURL(tokenId, CONTRACT_ADDRESS);
        const forceUpdateUrl = openseaGetAssetURL(tokenId, CONTRACT_ADDRESS, true);

        const openseaResult = await fetcher(getAssetUrl, openseaFetchOptions);

        const originalImageURL = openseaResult.image_original_url;
        if (!(originalImageURL || '').includes('ipfs.io')) {
            logger.info(`no ipfs url found for ${tokenId}: ${originalImageURL}`);
            logger.info(`updating metadata for ${tokenId}`);
            const forceResult = await fetcher(forceUpdateUrl, openseaFetchOptions);
            if (forceResult.error) {
                logger.info(forceResult);
            }
            try {
                const jobData = await OpenseaForceUpdate.enqueue({ tokenId }, { delay: '15s' });
            } catch (error) {
                logger.error(error);
            }
        }
        if (openseaResult.error) {
            logger.error(openseaResult);
        }
    },
);

export default OpenseaForceUpdate;
