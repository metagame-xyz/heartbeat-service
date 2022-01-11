import { Queue } from 'quirrel/next';

import { fetcher, ioredisClient, openseaGetAssetURL } from '@utils';
import { CONTRACT_ADDRESS } from '@utils/constants';
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
                logData.thrown_error = `metadataStr is null`;
                logger.log(logData);
                throw Error(logData.thrown_error);
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
            fetcher(openseaGetAssetURL(tokenId, CONTRACT_ADDRESS, true)); //dont need to wait this

            await OpenseaForceUpdate.enqueue(
                { tokenId, attempt: 1, newImageUrl: metadata.image },
                { delay: '15s', id: tokenId, override: true },
            );

            logSuccess(logData, `success: ${id}`);
        } catch (error) {
            logError(logData, error);
            throw Error(error);
        } finally {
        }
    },
);
