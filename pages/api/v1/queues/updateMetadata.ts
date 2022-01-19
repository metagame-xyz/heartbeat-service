import { Queue } from 'quirrel/next';

import { addOrUpdateNft } from '@utils/addOrUpdateNft';
import { LogData, logError, logSuccess } from '@utils/logging';
import { getAddressForTokenId } from '@utils/metadata';

export type UpdateMetadataJob = {
    tokenId: string;
};

export default Queue(
    'api/v1/queues/updateMetadata', // 👈 the route it's reachable on
    async (job: UpdateMetadataJob) => {
        const { tokenId } = job;

        const logData: LogData = {
            level: 'info',
            token_id: tokenId,
            function_name: 'updateMetadata',
            message: `begin`,
        };

        try {
            const address = await getAddressForTokenId(tokenId);
            logData.wallet_address = address;

            await addOrUpdateNft(address, tokenId);

            logSuccess(logData, `success: ${tokenId}`);
        } catch (error) {
            logError(logData, error);
            throw Error(error);
        }
    },
    {
        exclusive: true, // run one at a time
        retry: ['1h', '1h', '1h'],
    },
);
