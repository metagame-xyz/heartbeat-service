import { Queue } from 'quirrel/next';

import { fetcher, ioredisClient, openseaGetAssetURL } from '@utils';
import { CONTRACT_ADDRESS } from '@utils/constants';
import { addToIPFS, removeFromIPFS } from '@utils/ipfs';
import { logger } from '@utils/logging';
import { LogDataWithLevel } from '@utils/logging';
import { Metadata } from '@utils/metadata';

import OpenseaForceUpdate from './openseaForceUpdate';

type Job = {
    url: string;
    tokenId: string;
};

export default Queue(
    'api/v1/queues/screenshot', // 👈 the route it's reachable on
    async (job: Job) => {
        const { url, tokenId } = job;

        const logData: LogDataWithLevel = {
            level: 'info',
            token_id: tokenId,
            third_party_name: null,
            function_name: 'screenshot',
            message: `beginning screenshot for ${tokenId}`,
        };

        try {
            logData.third_party_name = 'ipfs';
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
                logData.third_party_name = 'ipfs';
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
            await fetcher(openseaGetAssetURL(tokenId, CONTRACT_ADDRESS, true));

            await OpenseaForceUpdate.enqueue({ tokenId, attempt: 1 }, { delay: '15s' });

            logger.log(logData);
        } catch (error) {
            logger.log((logData.thrown_error = error));
            throw Error(error);
        } finally {
        }
    },
);
