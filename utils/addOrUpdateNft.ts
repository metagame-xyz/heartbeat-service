import type { NextApiRequest, NextApiResponse } from 'next';

import ScreenshotQueue from '@api/queues/screenshot';

import {
    defaultProvider,
    getUserName,
    ioredisClient,
    isValidAlchemySignature,
    logger,
} from '@utils';
import { blackholeAddress } from '@utils/constants';
import { formatMetadata, getNFTData, Metadata, NFTs } from '@utils/metadata';
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
    /****************/
    /* GET NFT DATA */
    /****************/
    let nfts: NFTs, dateStr: string;
    try {
        [nfts, dateStr] = await getNFTData(minterAddress);
    } catch (error) {
        logger.error(error);
        return { statusCode: 500, error, message: 'Error in getNFTData' };
    }

    /*********************/
    /* DRAFT OF METADATA */
    /*********************/

    // this will log an error if it fails but not stop the rest of this function
    const userName = await getUserName(defaultProvider, minterAddress);

    const metadata = formatMetadata(minterAddress, nfts, dateStr, userName, tokenId);

    /*********************/
    /*  SAVE METADATA   */
    /*********************/
    try {
        // index by wallet address
        await ioredisClient.hset(minterAddress, {
            tokenId,
            metadata: JSON.stringify(metadata),
        });
    } catch (error) {
        logger.error({ error });
        return {
            statusCode: 500,
            error,
            message: `ioredisClient index by wallet address for ${minterAddress}`,
        };
    }

    try {
        // index by tokenId
        await ioredisClient.hset(tokenId, {
            address: minterAddress,
            metadata: JSON.stringify(metadata),
        });
    } catch (error) {
        logger.error({ error });
        return {
            statusCode: 500,
            error,
            message: `ioredisClient index by tokenId for ${minterAddress}`,
        };
    }

    /************************/
    /* SCREENSHOT NFT IMAGE */
    /************************/

    const imgUrl = activateUrlbox(tokenId);

    logger.info({ imgUrl });

    /************************/
    /*  QUEUE UPDATING IMG  */
    /************************/
    try {
        const jobData = await ScreenshotQueue.enqueue(
            {
                url: imgUrl,
                tokenId,
            },
            {
                delay: '1m',
            },
        );
    } catch (error) {
        logger.error(error);
        return { statusCode: 500, error, message: `screenshot queueing for ${minterAddress}` };
    }

    return {
        statusCode: 200,
        message: 'success',
        error: null,
        result: {
            tokenId,
            minterAddress,
            userName,
            ensName: userName,
        },
    };
}
