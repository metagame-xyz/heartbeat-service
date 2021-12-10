import { Queue } from 'quirrel/next';

import { ioredisClient, logger, Metadata } from '@utils';
import { addToIPFS } from '@utils/ipfs';

type Job = {
    url: string;
    tokenId: string;
};

export default Queue(
    'api/v1/queues/screenshot', // 👈 the route it's reachable on
    async (job: Job) => {
        const { url, tokenId } = job;
        const imageIFPSPath = await addToIPFS(url);

        console.log('imageIFPSPath', imageIFPSPath);

        const metadataStr = await ioredisClient.hget(tokenId, 'metadata');
        const metadata: Metadata = JSON.parse(metadataStr);

        /*********************/
        /* UPDATE METADATA   */
        /*********************/
        metadata.image = imageIFPSPath;
        const address = metadata.address;

        try {
            // index by wallet address
            await ioredisClient.hset(address, {
                tokenId,
                metadata: JSON.stringify(metadata),
            });
        } catch (error) {
            logger.error({ error });
        }

        try {
            // index by tokenId
            await ioredisClient.hset(tokenId, {
                address: address,
                metadata: JSON.stringify(metadata),
            });
        } catch (error) {
            logger.error({ error });
        }

        console.log('metadata updated');

        console.log('in the queue', tokenId, address);
    },
);
