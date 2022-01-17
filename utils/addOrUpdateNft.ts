import OpenseaForceUpdate from '@api/queues/openseaForceUpdate';
import ScreenshotQueue from '@api/queues/screenshot';

import { defaultProvider, getUserName, ioredisClient } from '@utils';
import { formatNewMetadata, getTxnData, Metadata, updateMetadata } from '@utils/metadata';
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
    forceScreenshot = false,
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
    let txnCounts;
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
            : updateMetadata(oldMetadata, txnCounts, userName);

        await ioredisClient.hset(address, { tokenId, metadata: JSON.stringify(metadata) });
        await ioredisClient.hset(tokenId, { address: address, metadata: JSON.stringify(metadata) });

        /************************/
        /*  GENERATE GLTF FILE  */
        /************************/
        logData.third_party_name = 'urlbox';
        const urlboxResponse = await generateGIFWithUrlbox(tokenId, true);

        const ifpsURL = await addToIPFS(urlboxResponse.image_url); // TODO update image_url to be the right key

        // we start with a "loading" image and then update to gif when it's ready
        if (firstTime) {
            metadata.image = ifpsURL; // TODO: update this
            await ioredisClient.hset(address, { tokenId, metadata: JSON.stringify(metadata) });
            await ioredisClient.hset(tokenId, {
                address: address,
                metadata: JSON.stringify(metadata),
            });
        }

        /************************/
        /*    UPDATE OPENSEA    */
        /************************/
        const jobData = await OpenseaForceUpdate.enqueue(
            { tokenId, attempt: 1, newImageUrl: metadata.image },
            { id: tokenId, override: true },
        );
        logData.job_data = jobData;
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
