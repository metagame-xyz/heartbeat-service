import type { NextApiRequest, NextApiResponse } from 'next';

import { isValidAlchemySignature } from '@utils';
import { addOrUpdateNft } from '@utils/addOrUpdateNft';
import { blackholeAddress, CONTRACT_ADDRESS } from '@utils/constants';
import { logger } from '@utils/logging';
import { getTokenIdForAddress } from '@utils/metadata';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    logger.info(`top of growFlower`);
    if (req.method !== 'POST') {
        /**
         * During development, it's useful to un-comment this block
         * so you can test some of your code by just hitting this page locally
         *
         */

        // const minterAddress = '0x3B3525F60eeea4a1eF554df5425912c2a532875D';
        // const tokenId = '1';

        const metadata = {};
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(metadata);
    }

    /****************/
    /*     AUTH     */
    /****************/
    if (!isValidAlchemySignature(req)) {
        const error = 'invalid event-forwarder Signature';
        logger.error({ error });
        return res.status(400).send({ error });
    }

    const activity = req.body.activity;

    // logger.info(activity);
    // logger.info(`CONTRACT_ADDRESS: ${CONTRACT_ADDRESS}`);

    const mintEvents = activity.filter(
        (e) =>
            e.fromAddress === blackholeAddress &&
            e.erc721TokenId !== null &&
            e.rawContract.address !== CONTRACT_ADDRESS,
    );
    // logger.info(mintEvents);

    const mintAddressesWithDuplicates = new Set(mintEvents.map((e) => e.toAddress));
    const mintAddresses = Array.from(mintAddressesWithDuplicates.values()) as string[];

    logger.info({ mintAddresses });

    let statusCode = 200;

    for (let i = 0; i < mintAddresses.length; i++) {
        let tokenId;
        try {
            tokenId = await getTokenIdForAddress(mintAddresses[i]);
        } catch (error) {
            logger.error(error);
            return res.status(500).send({ error });
        }

        const data = await addOrUpdateNft(mintAddresses[i], tokenId);

        if (data.error) {
            logger.error(data.message);
            return res.status(data.statusCode).send({});
        }

        statusCode = data.statusCode;
    }

    return res.status(statusCode).send({});
}
