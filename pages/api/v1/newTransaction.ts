import { EtherscanProvider, Filter, getDefaultProvider } from '@ethersproject/providers';
import { commify, formatEther, formatUnits } from '@ethersproject/units';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
    fetcher,
    formatDateObjToShortTime,
    getERC721Transfers,
    getOldestTransaction,
    ioredisClient,
    isValidEventForwarderSignature,
    logger,
    Metadata,
    timestampToDate,
    zodiac,
} from '@utils';
import {
    ALCHEMY_PROJECT_ID,
    blackholeAddress,
    CONTRACT_BIRTHBLOCK,
    INFURA_PROJECT_ID,
    networkStrings,
    WEBSITE_URL,
} from '@utils/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    logger.info(req.body);
    if (req.method !== 'POST') {
        /**
         * During development, it's useful to un-comment this block
         * so you can test some of your code by just hitting this page locally
         *
         */

        const minterAddress = '0x3B3525F60eeea4a1eF554df5425912c2a532875D';
        const tokenId = 1;

        // const defaultProvider = getDefaultProvider(networkStrings.ethers, {
        //     infura: INFURA_PROJECT_ID,
        //     alchemy: ALCHEMY_PROJECT_ID,
        // });

        const etherscanProvider = new EtherscanProvider('homestead');

        const etherscanURl = etherscanProvider.getUrl('account', {
            action: 'tokennfttx',
            address: minterAddress,
            startblock: '0',
            endblock: 'latest',
            page: '1',
            offset: '1000',
        });

        const { status, message, result } = await fetcher(etherscanURl);

        type Event = {
            tokenSymbol: string;
            from: string;
        };

        const mintEvents = result.filter((event: Event) => event.from === blackholeAddress);
        const mintSymbols: Array<string> = mintEvents.map((event: Event) => event.tokenSymbol);

        const mintMap = mintSymbols.reduce((allSymbols, symbol) => {
            if (symbol in allSymbols) {
                allSymbols[symbol]++;
            } else {
                allSymbols[symbol] = 1;
            }
            return allSymbols;
        }, {});

        // const value = mintEvents[0].value;

        // console.log(value);
        // console.log(formatEther(value));

        return res.status(200).send({ mintMap });

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
