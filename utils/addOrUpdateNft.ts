import ScreenshotQueue from '@api/queues/screenshot';

import { defaultProvider, getUserName, ioredisClient, logger } from '@utils';
import { formatMetadata, getNFTData, NFTs } from '@utils/metadata';
import { activateUrlbox } from '@utils/urlbox';

export type newNftResponse = {
    statusCode: number;
    message: string;
    result?: any;
    ensName?: string;
    error: any;
};

export async function addOrUpdateNft(
    minterAddress: string,
    tokenId: string,
): Promise<newNftResponse> {
    const address = minterAddress.toLowerCase();
    /****************/
    /* GET NFT DATA */
    /****************/
    let nfts: NFTs, dateStr: string;
    try {
        [nfts, dateStr] = await getNFTData(address, 'homestead');
    } catch (error) {
        logger.error(error);
        return { statusCode: 500, error, message: 'Error in getNFTData' };
    }

    nfts['0x7d414bc0482432d2d74021095256aab2e6d3f6b8'] = {
        tokenSymbol: 'TGRDN',
        tokenName: 'Token Garden',
        count: 1,
        special: true,
    };

    logger.info(nfts);

    /*********************/
    /* DRAFT OF METADATA */
    /*********************/

    // this will log an error if it fails but not stop the rest of this function
    const userName = await getUserName(defaultProvider, address);

    const metadata = formatMetadata(address, nfts, dateStr, userName, tokenId);

    /*********************/
    /*  SAVE METADATA   */
    /*********************/
    try {
        // index by wallet address
        await ioredisClient.hset(address, {
            tokenId,
            metadata: JSON.stringify(metadata),
        });
    } catch (error) {
        logger.error({ error });
        return {
            statusCode: 500,
            error,
            message: `ioredisClient index by wallet address for ${address}`,
        };
    }

    try {
        // index by tokenId
        await ioredisClient.hset(tokenId, {
            address: address,
            metadata: JSON.stringify(metadata),
        });
    } catch (error) {
        logger.error({ error });
        return {
            statusCode: 500,
            error,
            message: `ioredisClient index by tokenId for ${address}`,
        };
    }

    /************************/
    /* SCREENSHOT NFT IMAGE */
    /************************/

    const imgUrl = await activateUrlbox(tokenId, metadata.totalNFTCount, true);

    logger.info(`imgUrl for tokenId ${tokenId}: ${imgUrl}`);

    /************************/
    /*  QUEUE UPDATING IMG  */
    /************************/

    // TODO skip if already queued: https://docs.quirrel.dev/api/queue#getbyid
    try {
        const jobData = await ScreenshotQueue.enqueue(
            {
                url: imgUrl,
                tokenId,
            },
            {
                delay: '30s',
            },
        );
    } catch (error) {
        logger.error(error);
        return { statusCode: 500, error, message: `screenshot queueing for ${address}` };
    }

    return {
        statusCode: 200,
        message: 'success',
        error: null,
        result: {
            tokenId,
            minterAddress: address,
            userName,
            ensName: userName,
        },
    };
}
