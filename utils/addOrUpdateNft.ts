import { getUserName, ioredisClient } from '@utils';
import {
    formatMetadataWithOldMetadata,
    formatNewMetadata,
    getTxnData,
    Metadata,
    TxnCounts,
} from '@utils/metadata';
import { generateGIFWithUrlbox } from '@utils/urlbox';

import { LogData, logError, logSuccess } from './logging';

export type newNftResponse = {
    tokenId: string;
    minterAddress: string;
    userName: string;
    ensName: string;
};

export async function addOrUpdateNft(
    minterAddress: string,
    tokenId: string,
    forceCount = false,
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
    let userName: string;
    try {
        logData.third_party_name = 'getTxnData';
        txnCounts = await getTxnData(address, tokenId);

        logData.third_party_name = 'ethers getUserName';
        userName = await getUserName(address);

        logData.third_party_name = 'redis';
        const oldMetadata: Metadata = JSON.parse(await ioredisClient.hget(tokenId, 'metadata'));
        const firstTime = !oldMetadata;

        let metadata = firstTime
            ? formatNewMetadata(address, txnCounts, userName, tokenId)
            : formatMetadataWithOldMetadata(oldMetadata, txnCounts, userName);

        if (forceCount) {
            metadata.txnCounts.ethereum.transactionsYesterday += 1;
            metadata.txnCounts.ethereum.transactionsLastWeek += 1;
            metadata.txnCounts.ethereum.transactionsLastMonth += 1;
            metadata.txnCounts.ethereum.totalTransactions += 1;
        }

        await ioredisClient.hset(address, { tokenId, metadata: JSON.stringify(metadata) });
        await ioredisClient.hset(tokenId, { address: address, metadata: JSON.stringify(metadata) });

        logData.third_party_name = 'urlbox';
        await generateGIFWithUrlbox(tokenId);

        logSuccess(logData);
        return {
            tokenId,
            minterAddress: address,
            userName,
            ensName: userName,
        };
    } catch (error) {
        logError(logData, error);
        throw error;
    }
}
