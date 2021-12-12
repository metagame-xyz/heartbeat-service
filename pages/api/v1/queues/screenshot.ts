import { Queue } from 'quirrel/next';

import { fetcher, FetcherError, ioredisClient, logger, Metadata } from '@utils';
import { networkStrings } from '@utils/constants';
import { addToIPFS } from '@utils/ipfs';

type Job = {
    url: string;
    tokenId: string;
};

export default Queue(
    'api/v1/queues/screenshot', // 👈 the route it's reachable on
    async (job: Job) => {
        const { url, tokenId } = job;

        let imageIPFSPath = 'addToIPFS HAD AN ERROR';
        try {
            imageIPFSPath = await addToIPFS(url);
        } catch (error) {
            logger.error(error);
        }

        let metadataStr;
        try {
            metadataStr = await ioredisClient.hget(tokenId, 'metadata');
        } catch (error) {
            logger.error({ error, extra: 'iosredis read error' });
        }

        if (!metadataStr) {
            console.log(`metadataStr is null for ${tokenId}`);
            return;
        }

        const metadata: Metadata = JSON.parse(metadataStr);

        /*********************/
        /* UPDATE METADATA   */
        /*********************/
        metadata.image = imageIPFSPath;
        const address = metadata.address;

        try {
            // index by wallet address
            await ioredisClient.hset(address, {
                tokenId,
                metadata: JSON.stringify(metadata),
            });
        } catch (error) {
            logger.error({ error, extra: 'iosredis write error by address' });
        }

        try {
            // index by tokenId
            await ioredisClient.hset(tokenId, {
                address: address,
                metadata: JSON.stringify(metadata),
            });
        } catch (error) {
            logger.error({ error, extra: 'iosredis write error by tokenId' });
        }

        /*********************/
        /*  UPDATE OPENSEA   */
        /*********************/

        function openseaForceUpdateURL(tokenId, contractAddress) {
            return `https://${networkStrings.openseaAPI}opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`;
        }

        try {
            const { permalink } = await fetcher(openseaForceUpdateURL(tokenId, address));
            logger.info(permalink);
        } catch (error) {
            if (error instanceof FetcherError) {
                // it logs in fetcher
            } else {
                logger.error(`unkown error: ${error.name} ${error.message}`);
            }
        }
    },
);
