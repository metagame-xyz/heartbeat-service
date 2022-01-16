import { Queue } from 'quirrel/next';

import { fetcher, forceUpdateOpenSeaMetadata, ioredisClient } from '@utils';
import { addToIPFS, removeFromIPFS } from '@utils/ipfs';
import { LogData, logError, logger, logSuccess } from '@utils/logging';
import { Metadata } from '@utils/metadata';

import OpenseaForceUpdate from './openseaForceUpdate';

type ScreenshotJob = {
    id: string;
    url: string;
    tokenId: string;
};

export default Queue(
    'api/v1/queues/screenshot', // 👈 the route it's reachable on
    async (job: ScreenshotJob) => {
        const { url, tokenId, id } = job;

        const logData: LogData = {
            level: 'debug',
            token_id: tokenId,
            function_name: 'screenshot',
            message: `begin`,
        };

        try {
            logData.third_party_name = 'ipfs_add';
            const imageIPFSPath = await addToIPFS(url);

            logData.third_party_name = 'redis';
            const metadataStr = await ioredisClient.hget(tokenId, 'metadata');

            if (!metadataStr) {
                const error = `metadataStr is null`;
                logError(logData, error);
                throw Error(error);
            }

            const metadata: Metadata = JSON.parse(metadataStr);

            if (metadata.image.includes('ipfs://')) {
                logData.third_party_name = 'ipfs_remove';
                await removeFromIPFS(metadata.image);
            }

            /*********************/
            /* UPDATE METADATA   */
            /*********************/
            metadata.image = imageIPFSPath;
            const address = metadata.address.toLowerCase();

            logData.third_party_name = 'redis';
            await ioredisClient.hset(address, { tokenId, metadata: JSON.stringify(metadata) });
            await ioredisClient.hset(tokenId, {
                address: address,
                metadata: JSON.stringify(metadata),
            });

            /*********************/
            /*  UPDATE OPENSEA   */
            /*********************/

            logData.third_party_name = 'opensea';
            await forceUpdateOpenSeaMetadata(tokenId);

            const jobData = await OpenseaForceUpdate.enqueue(
                // dont need to wait for this either
                { tokenId, attempt: 1, newImageUrl: metadata.image },
                { delay: '15s', id: tokenId, override: true },
            );
            logData.job_data = jobData;

            logSuccess(logData, `success: ${id}`);
        } catch (error) {
            logError(logData, error);
            throw Error(error);
        } finally {
        }
    },
);
