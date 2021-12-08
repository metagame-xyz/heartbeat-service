import { EtherscanProvider } from '@ethersproject/providers';
import mql from '@microlink/mql';
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

import {
    fetcher,
    getUserName,
    ioredisClient,
    isValidEventForwarderSignature,
    logger,
    Metadata,
    tsToMonthAndYear,
} from '@utils';
import { blackholeAddress, MICROLINK_API_KEY, WEBSITE_URL } from '@utils/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    logger.info(req.body);
    if (req.method !== 'POST') {
        /**
         * During development, it's useful to un-comment this block
         * so you can test some of your code by just hitting this page locally
         *
         */

        const minterAddress = '0x3B3525F60eeea4a1eF554df5425912c2a532875D';
        const tokenId = '1';

        const etherscanProvider = new EtherscanProvider('homestead');

        const etherscanURl = etherscanProvider.getUrl('account', {
            action: 'tokennfttx',
            address: minterAddress,
            startblock: '0',
            endblock: 'latest',
            page: '1',
            offset: '1000',
        });

        let { status, message, result } = await fetcher(etherscanURl);

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

        const userName = await getUserName(etherscanProvider, minterAddress);

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

        const url = `https://dev.tokengarden.art/garden/1`;

        const { data, response } = await mql(url, {
            apiKey: MICROLINK_API_KEY,
            screenshot: true,
            waitForSelector: '.gui',
            waitForTimeout: 25000,
            timeout: 28000,
            ttl: '1m',
        });

        console.log(data);
        console.log(response.headers);

        const imgdataResponse = await fetch(data.screenshot.url);
        const imgdata = await imgdataResponse.buffer();

        res.setHeader('Content-Type', 'image/jpg');
        return res.status(200).send(imgdata);

        // return res.status(200).send({ metadata });

        // return res.status(404).send({ error: '404' });
    }

    // check the message is coming from the event-forwarder
    if (!isValidEventForwarderSignature(req)) {
        const error = 'invalid event-forwarder Signature';
        logger.error({ error });
        return res.status(400).send({ error });
    }

    // const { minterAddress, tokenId } = req.body;

    // res.status(504).end();
    res.status(200).send({});
}
