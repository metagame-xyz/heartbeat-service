import type { NextApiRequest, NextApiResponse } from 'next';

import {
    defaultProvider,
    getUserName,
    ioredisClient,
    isValidAlchemySignature,
    logger,
} from '@utils';
import { addOrUpdateNft } from '@utils/addOrUpdateNft';
import { blackholeAddress } from '@utils/constants';
import { formatMetadata, getNFTData, getTokenIdForAddress, Metadata, NFTs } from '@utils/metadata';
import { activateUrlbox } from '@utils/urlbox';

import ScreenshotQueue from './queues/screenshot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    // if (!isValidAlchemySignature(req)) {
    //     const error = 'invalid event-forwarder Signature';
    //     logger.error({ error });
    //     return res.status(400).send({ error });
    // }

    const activity = req.body.activity;

    const mintEvents = activity.filter(
        (e) => e.fromAddress === blackholeAddress && e.erc721TokenId !== null,
    );

    // logger.info(mintEvents);

    const mintAddresses = mintEvents.map((e) => e.toAddress);

    logger.info(mintAddresses);

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
