import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import Urlbox from 'urlbox';

import {
    defaultProvider,
    getUserName,
    ioredisClient,
    isValidEventForwarderSignature,
    logger,
} from '@utils';
import { doneDivClass, URL_BOX_API_SECRET, URLBOX_API_KEY } from '@utils/constants';
import { formatMetadata, getNFTData, Metadata, NFTs } from '@utils/metadata';

import ScreenshotQueue from '../../queues/screenshot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    logger.info(`top of newTransaction from tokeId ${req.body.tokenId}`);
    if (req.method !== 'POST') {
        /**
         * During development, it's useful to un-comment this block
         * so you can test some of your code by just hitting this page locally
         *
         */

        const minterAddress = '0x3B3525F60eeea4a1eF554df5425912c2a532875D';
        const tokenId = '1';

        const metadata = {};
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(metadata);
    }

    /****************/
    /*     AUTH     */
    /****************/
    if (!isValidEventForwarderSignature(req)) {
        const error = 'invalid event-forwarder Signature';
        logger.error({ error });
        return res.status(400).send({ error });
    }

    const { minterAddress, tokenId } = req.body;

    /****************/
    /* GET NFT DATA */
    /****************/
    let nfts: NFTs, dateStr: string;
    try {
        [nfts, dateStr] = await getNFTData(minterAddress);
    } catch (error) {
        logger.error(error);
        return res.status(500).send(error);
    }

    /*********************/
    /* DRAFT OF METADATA */
    /*********************/

    // this will log an error if it fails but not stop the rest of this function
    const userName = await getUserName(defaultProvider, minterAddress);

    let metadata: Metadata;
    try {
        metadata = await formatMetadata(minterAddress, nfts, dateStr, userName, tokenId);
    } catch (error) {
        logger.error(error);
        return res.status(500).send(error);
    }

    logger.info(metadata);

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
        return res.status(500).send({ message: 'ioredis error', error });
    }

    try {
        // index by tokenId
        await ioredisClient.hset(tokenId, {
            address: minterAddress,
            metadata: JSON.stringify(metadata),
        });
    } catch (error) {
        logger.error({ error });
        return res.status(500).send({ message: 'ioredis error 2', error });
    }

    /************************/
    /* SCREENSHOT NFT IMAGE */
    /************************/

    const url = `https://dev.tokengarden.art/privateGarden/${tokenId}`; //TODO un-hardcode

    const urlbox = Urlbox(URLBOX_API_KEY, URL_BOX_API_SECRET);
    const baseOptions = {
        url,
        format: 'png',
        quality: 100,
        // retina: true,
    };

    // force and wait for the image to load
    const optionsWithForce = {
        ...baseOptions,
        full_page: true,
        force: true,
        wait_for: `.${doneDivClass}`,
        wait_timeout: 120000,
        // fail_if_selector_missing: true,
    };

    const forceImgUrl = urlbox.buildUrl(optionsWithForce);
    const imgUrl = urlbox.buildUrl(baseOptions);

    logger.info(`begin screenshot of ${imgUrl}`);
    const start = performance.now();
    const data = await fetch(forceImgUrl);
    const end = performance.now();
    logger.info(`fetching image took ${(end - start) / 1000} seconds`);
    logger.info({ data });

    /************************/
    /*  QUEUE UPDATING IMG  */
    /************************/
    // try {
    //     const jobData = await ScreenshotQueue.enqueue(
    //         {
    //             url: imgUrl,
    //             tokenId,
    //         },
    //         {
    //             delay: '1m',
    //         },
    //     );
    // } catch (error) {
    //     logger.error(error);
    //     return res.status(500).send({ message: 'screenshot queuing error', error });
    // }

    res.status(200).send({
        minterAddress,
        tokenId,
        ensName: userName,
        status: 1,
        message: 'success',
        result: { minterAddress, tokenId, ensName: userName },
    });
}
