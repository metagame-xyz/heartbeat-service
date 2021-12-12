import { EtherscanProvider } from '@ethersproject/providers';
import mql from '@microlink/mql';
import { Redis } from 'ioredis';
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import Urlbox from 'urlbox';

import {
    defaultProvider,
    fetcher,
    getUserName,
    ioredisClient,
    isValidEventForwarderSignature,
    logger,
    Metadata,
    tsToMonthAndYear,
} from '@utils';
import {
    blackholeAddress,
    ETHERSCAN_API_KEY,
    MICROLINK_API_KEY,
    URL_BOX_API_SECRET,
    URLBOX_API_KEY,
    WEBSITE_URL,
} from '@utils/constants';

import ScreenshotQueue from './queues/screenshot';

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
    const etherscanProvider = new EtherscanProvider('homestead', ETHERSCAN_API_KEY);

    const etherscanURl = etherscanProvider.getUrl('account', {
        action: 'tokennfttx',
        address: minterAddress,
        startblock: '0',
        endblock: 'latest',
        page: '1',
        offset: '1000',
    });

    let status, message, result;
    try {
        ({ status, message, result } = await fetcher(etherscanURl));
    } catch (error) {
        logger.error(`Error in fetcher from etherscan: ${error}`);
        // logger.error({ status, message, result });
        return res.status(500).send({ status, message, result });
    }

    if (status != 1) {
        logger.error(`etherscan status: ${status}. ${result}. returning a 500`);
        // probably" Max rate limit reached", 5/sec
        logger.error({ status, message, result });
        return res.status(500).send({ status, message, result });
    }

    type Event = {
        tokenSymbol: string;
        from: string;
        timeStamp: number;
    };

    const mintEvents: Array<Event> = result.filter(
        (event: Event) => event.from === blackholeAddress,
    );
    const mintSymbols: Array<string> = mintEvents.map((event: Event) => event.tokenSymbol);

    const mintMap: Record<string, number> = mintSymbols.reduce((allSymbols, symbol) => {
        if (symbol in allSymbols) {
            allSymbols[symbol]++;
        } else {
            allSymbols[symbol] = 1;
        }
        return allSymbols;
    }, {});

    const userName = await getUserName(defaultProvider, minterAddress);

    const dateStr = tsToMonthAndYear(mintEvents[0].timeStamp);
    const creatorMap = {
        BBLOCK: 'The Metagame',
        LOOT: 'Dom Hoffman',
    };

    const NFTs = Object.entries(mintMap).map(([symbol, count]) => ({
        symbol,
        count,
        ...(creatorMap[symbol] && { creator: creatorMap[symbol] }), // only add creator if it's in the map
    }));

    const uniqueNFTCount = Object.keys(mintMap).length;

    /*********************/
    /* DRAFT OF METADATA */
    /*********************/
    const metadata: Metadata = {
        name: `${userName}'s Token Garden`,
        description: `A garden that's been growning since ${dateStr}. It has ${uniqueNFTCount} flowers so far.`,
        image: `https://${WEBSITE_URL}/api/v1/image/${tokenId}`,
        external_url: `https://${WEBSITE_URL}/birthblock/${tokenId}`,
        address: minterAddress,
        uniqueNFTCount,
        totalNFTCount: Object.values(mintMap).reduce((t, n) => t + n),
        NFTs,
    };

    logger.info(metadata);

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
    const url = `https://dev.tokengarden.art/garden/${tokenId}`; //TODO un-hardcode

    const urlbox = Urlbox(URLBOX_API_KEY, URL_BOX_API_SECRET);
    const baseOptions = {
        url,
        format: 'png',
        quality: 100,
    };
    // Set your options
    const optionsWithForce = {
        ...baseOptions,
        full_page: true,
        force: true,
        wait_for: '.gui',
        fail_if_selector_missing: true,
    };

    const forceImgUrl = urlbox.buildUrl(optionsWithForce);
    const imgUrl = urlbox.buildUrl(baseOptions);

    // send and forget
    fetch(forceImgUrl);

    logger.info({ imgUrl });

    /************************/
    /*  QUEUE UPDATING IMG  */
    /************************/
    try {
        const jobData = await ScreenshotQueue.enqueue(
            {
                url: imgUrl,
                tokenId,
            },
            {
                delay: '1m',
            },
        );
    } catch (error) {
        logger.error(error);
    }

    res.status(200).send({
        minterAddress,
        tokenId,
        ensName: userName,
        status: 1,
        message: 'success',
        result: { minterAddress, tokenId, ensName: userName },
    });
}
