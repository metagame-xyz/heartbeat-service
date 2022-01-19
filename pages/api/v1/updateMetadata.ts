import type { NextApiRequest, NextApiResponse } from 'next';

import { isValidAlchemySignature } from '@utils';
import { addOrUpdateNft } from '@utils/addOrUpdateNft';
import { blackholeAddress, CONTRACT_ADDRESS } from '@utils/constants';
import { LogData, logError, logSuccess } from '@utils/logging';
import { getTokenIdForAddress } from '@utils/metadata';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(404).send({});
    }

    /****************/
    /*     AUTH     */
    /****************/
    if (!isValidAlchemySignature(req)) {
        const error = 'invalid event-forwarder Signature';
        return res.status(403).send({ error });
    }

    const activity = req.body.activity;

    const mintEvents = activity.filter(
        (e) =>
            e.fromAddress === blackholeAddress &&
            e.erc721TokenId !== null &&
            e.rawContract.address !== CONTRACT_ADDRESS,
    );

    const mintAddressesWithDuplicates = new Set(mintEvents.map((e) => e.toAddress));
    const mintAddresses = Array.from(mintAddressesWithDuplicates.values()) as string[];

    const logData: LogData = {
        level: 'info',
        function_name: 'updateMetadata',
        message: `begin`,
    };
    let statusCode = 200;

    for (let i = 0; i < mintAddresses.length; i++) {
        let tokenId;
        const logData: LogData = {
            level: 'info',
            function_name: 'updateMetadata_in_loop',
            message: `mintAddresses[${i}]: ${mintAddresses[i]}`,
            wallet_address: mintAddresses[i],
        };
        try {
            logData.third_party_name = 'redis';
            tokenId = await getTokenIdForAddress(mintAddresses[i]);
            logData.token_id = tokenId;
        } catch (error) {
            logError(logData, error);
            return res.status(500).send({ error });
        }

        const data = await addOrUpdateNft(mintAddresses[i], tokenId);

        if (data.error) {
            logError(logData, data.error);
            return res.status(data.statusCode).send({});
        }

        statusCode = data.statusCode;
    }

    const message = mintAddresses.length ? `mintAddresses: ${mintAddresses}` : 'no mint events';
    logSuccess(logData, message);

    return res.status(statusCode).send({});
}
