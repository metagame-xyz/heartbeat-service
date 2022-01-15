import ScreenshotQueue from '@api/queues/screenshot';

import { defaultProvider, fetcher, getUserName, ioredisClient, openseaGetAssetURL } from '@utils';
import { formatMetadata, getNFTData, Metadata, NFTs } from '@utils/metadata';
import { activateUrlbox } from '@utils/urlbox';

import { CONTRACT_ADDRESS } from './constants';
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
    let message = 'shouldnt ever see this';
    try {
        logData.third_party_name = 'redis';
        const oldMetadata: Metadata = JSON.parse(await ioredisClient.hget(tokenId, 'metadata'));
        await ioredisClient.hset(address, { tokenId, metadata: JSON.stringify(metadata) });
        await ioredisClient.hset(tokenId, { address: address, metadata: JSON.stringify(metadata) });

        if (oldMetadata.uniqueNFTCount !== metadata.uniqueNFTCount) {
            message = 'uniqueNFTCount changed, new screenshot';
            /************************/
            /* SCREENSHOT NFT IMAGE */
            /************************/
            logData.third_party_name = 'urlbox';
            const imgUrl = await activateUrlbox(tokenId, metadata.totalNFTCount, true);

            /************************/
            /*  QUEUE UPDATING IMG  */
            /************************/

            logData.third_party_name = 'queue/screenshot';
            const id = `${tokenId}-${metadata.totalNFTCount}`;
            const jobData = await ScreenshotQueue.enqueue(
                {
                    id,
                    url: imgUrl,
                    tokenId,
                },
                {
                    delay: '30s',
                    retry: ['15s', '30s', '1m', '5m', '10m', '30m', '1h', '2h', '4h'],
                    id,
                    override: false,
                },
            );
        } else {
            message = 'uniqueNFTCount did not change, no new screenshot';
            // if no new unique nfts, just update the metadata on OpenSea
            fetcher(openseaGetAssetURL(tokenId, CONTRACT_ADDRESS, true));
        }
    } catch (error) {
        logError(logData, error);
        return { statusCode: 500, error, message: `screenshot queueing for ${address}` };
    }

    logSuccess(logData, message);

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
