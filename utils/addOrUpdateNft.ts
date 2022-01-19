import OpenseaForceUpdate from '@api/queues/openseaForceUpdate';
import ScreenshotQueue from '@api/queues/screenshot';

import { defaultProvider, getUserName, ioredisClient } from '@utils';
import {
    formatMetadataWithOldMetadata,
    formatNewMetadata,
    getTxnData,
    Metadata,
    TxnCounts,
} from '@utils/metadata';
import { forceUpdateOpenSeaMetadata } from '@utils/requests';
import { activateUrlbox, generateGIFWithUrlbox } from '@utils/urlbox';

import { addToIPFS } from './ipfs';
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
    /* GET TXN DATA */
    /****************/
    let txnCounts: TxnCounts;
    try {
        txnCounts = await getTxnData(address);
    } catch (error) {
        logError(logData, error);
        return { statusCode: 500, error, message: 'Error in getNFTData' };
    }

    /*********************/
    /* DRAFT OF METADATA */
    /*********************/

    // this will log an error if it fails but not stop the rest of this function
    const userName = await getUserName(address);

    /*********************/
    /*  SAVE METADATA   */
    /*********************/
    try {
        logData.third_party_name = 'redis';
        const oldMetadata: Metadata = JSON.parse(await ioredisClient.hget(tokenId, 'metadata'));
        const firstTime = !oldMetadata;

        let metadata = firstTime
            ? formatNewMetadata(address, txnCounts, userName, tokenId)
            : formatMetadataWithOldMetadata(oldMetadata, txnCounts, userName);

        await ioredisClient.hset(address, { tokenId, metadata: JSON.stringify(metadata) });
        await ioredisClient.hset(tokenId, { address: address, metadata: JSON.stringify(metadata) });

        /************************/
        /*     GENERATE GIF     */
        /************************/
        logData.third_party_name = 'urlbox';
        await generateGIFWithUrlbox(tokenId, true);
    } catch (error) {
        logError(logData, error);
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
