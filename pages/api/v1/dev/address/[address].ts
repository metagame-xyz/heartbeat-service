import { EtherscanProvider } from '@ethersproject/providers';
import type { NextApiRequest, NextApiResponse } from 'next';

import { fetcher, getUserName, logger, Metadata, tsToMonthAndYear } from '@utils';
import { blackholeAddress, MICROLINK_API_KEY, WEBSITE_URL } from '@utils/constants';
import { addToIPFS } from '@utils/ipfs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { address } = req.query;
    const addressString: string = Array.isArray(address) ? address[0] : address;

    /****************/
    /* GET NFT DATA */
    /****************/
    const etherscanProvider = new EtherscanProvider('homestead');

    const etherscanURl = etherscanProvider.getUrl('account', {
        action: 'tokennfttx',
        address: addressString,
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

    const userName = await getUserName(etherscanProvider, addressString);

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
        image: `https://${WEBSITE_URL}/api/v1/image/`,
        external_url: `https://${WEBSITE_URL}/birthblock/`,
        address: addressString,
        uniqueNFTCount,
        totalNFTCount: Object.values(mintMap).reduce((t, n) => t + n),
        NFTs,
    };

    res.send(metadata);
}
