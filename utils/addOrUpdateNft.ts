import ScreenshotQueue from '@api/queues/screenshot';

import { defaultProvider, getUserName, ioredisClient } from '@utils';
import { formatMetadata, getNFTData, NFTs } from '@utils/metadata';
import { activateUrlbox } from '@utils/urlbox';

import { LogData, logError, logger, logSuccess } from './logging';

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

    const logData: LogData = {
        level: 'info',
        token_id: tokenId,
        function_name: 'addOrUpdateNft',
        message: `begin`,
        wallet_address: address,
    };

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

    // logger.info(nfts);

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
        logData.third_party_name = 'redis';
        await ioredisClient.hset(address, { tokenId, metadata: JSON.stringify(metadata) });
        await ioredisClient.hset(tokenId, { address: address, metadata: JSON.stringify(metadata) });

        /************************/
        /* SCREENSHOT NFT IMAGE */
        /************************/
        logData.third_party_name = 'urlbox';
        const imgUrl = await activateUrlbox(tokenId, metadata.totalNFTCount, true);

        // logger.info(`imgUrl for tokenId ${tokenId}: ${imgUrl}`);

        /************************/
        /*  QUEUE UPDATING IMG  */
        /************************/

        // TODO skip if already queued: https://docs.quirrel.dev/api/queue#getbyid

        logData.third_party_name = 'queue/screenshot';
        const jobData = await ScreenshotQueue.enqueue(
            {
                url: imgUrl,
                tokenId,
            },
            {
                delay: '30s',
                retry: ['15s', '30s', '1m', '5m', '10m', '30m', '1h', '2h', '4h'],
                // id: imgUrl,
                // exclusive: true,
            },
        );
    } catch (error) {
        logError(logData, error);
        // logger.error(error);
        return { statusCode: 500, error, message: `screenshot queueing for ${address}` };
    }

    logSuccess(logData);

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
