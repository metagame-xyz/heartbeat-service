import mql from '@microlink/mql';
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import Url2png from 'url2png';
import Urlbox from 'urlbox';

import {
    defaultProvider,
    getUserName,
    ioredisClient,
    isValidEventForwarderSignature,
    logger,
} from '@utils';
import {
    doneDivClass,
    MICROLINK_API_KEY,
    URL2PNG_API_KEY,
    URL2PNG_SECRET,
    URL_BOX_API_SECRET,
    URLBOX_API_KEY,
} from '@utils/constants';
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
    const address: string = minterAddress.toLowerCase();

    /****************/
    /* GET NFT DATA */
    /****************/
    let nfts: NFTs, dateStr: string;
    try {
        [nfts, dateStr] = await getNFTData(address);
    } catch (error) {
        logger.error(error);
        return res.status(500).send(error);
    }

    /*********************/
    /* DRAFT OF METADATA */
    /*********************/

    // this will log an error if it fails but not stop the rest of this function
    const userName = await getUserName(defaultProvider, address);

    let metadata: Metadata;
    try {
        metadata = await formatMetadata(address, nfts, dateStr, userName, tokenId);
    } catch (error) {
        logger.error(error);
        return res.status(500).send(error);
    }

    logger.info(`unique count: ${metadata.uniqueNFTCount}`);

    /*********************/
    /*  SAVE METADATA   */
    /*********************/
    try {
        // index by wallet address
        await ioredisClient.hset(address, {
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
            address: address,
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
        format: 'jpg',
        quality: 100,
        retina: true,
        full_page: true,
        wait_for: `.${doneDivClass}`,
        wait_timeout: 180000,
        fail_if_selector_missing: true,
        // retina: true,
    };

    // force and wait for the image to load
    const optionsWithForce = {
        ...baseOptions,
        force: true,
        gpu: true,
    };

    const forceImgUrl = urlbox.buildUrl(optionsWithForce);
    const imgUrl = urlbox.buildUrl(baseOptions);

    logger.info(`begin screenshot of ${imgUrl}`);
    logger.info(`force URL: ${forceImgUrl}`);
    let start = performance.now();
    const data = await fetch(forceImgUrl);
    let end = performance.now();
    logger.info(`fetching image took ${(end - start) / 1000} seconds`);
    logger.info(data);

    start = performance.now();
    const cachedData = await fetch(imgUrl);
    end = performance.now();
    logger.info(`fetching image took ${(end - start) / 1000} seconds`);
    logger.info(cachedData);

    // const url = `https://dev.tokengarden.art/privateGarden/${tokenId}`; //TODO un-hardcode
    // logger.info(`begin screenshot of ${url}`);
    // const start = performance.now();
    // const { status, data, response } = await mql(url, {
    //     apiKey: MICROLINK_API_KEY,
    //     screenshot: true,
    //     waitForSelector: '.done',
    //     // waitForTimeout: 25000,
    //     timeout: 120000,
    //     ttl: '1m',
    // });

    // const end = performance.now();
    // console.log(`fetching image took ${(end - start) / 1000} seconds`);
    // console.log('status:', status);
    // console.log('data:', data);
    // console.log('response:', response);
    // console.log(data?.screenshot?.url);

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
        minterAddress: address,
        tokenId,
        ensName: userName,
        status: 1,
        message: 'success',
        result: { minterAddress: address, tokenId, ensName: userName },
    });
}
