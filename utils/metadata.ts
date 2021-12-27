import { EtherscanProvider } from '@ethersproject/providers';

import { fetcher, ioredisClient, logger, tsToMonthAndYear } from '@utils';
import { blackholeAddress, ETHERSCAN_API_KEY, networkStrings, WEBSITE_URL } from '@utils/constants';

export type NftEvent = {
    tokenSymbol: string;
    from?: string;
    timeStamp?: number;
    contractAddress?: string;
    tokenName: string;
    count?: number;
    creator?: string;
};

export type NFTs = {
    string?: NftEvent;
};

/****************/
/* GET NFT DATA */
/****************/
export async function getNFTData(
    minterAddress: string,
    network = networkStrings.etherscanAPI,
): Promise<[NFTs, string]> {
    const address = minterAddress.toLowerCase();
    const etherscanProvider = new EtherscanProvider(network, ETHERSCAN_API_KEY);

    const offset = 1000;
    let page = 1;
    let eventsInLastPage = offset;

    function getEtherscanUrl(page: number): string {
        return etherscanProvider.getUrl('account', {
            action: 'tokennfttx',
            address,
            startblock: '0',
            endblock: 'latest',
            page: page.toString(),
            offset: offset.toString(),
        });
    }

    let totalResult = [];

    while (eventsInLastPage === 1000) {
        let status, message, result;
        try {
            ({ status, message, result } = await fetcher(getEtherscanUrl(page)));
            eventsInLastPage = result.length;
            page++;
        } catch (error) {
            logger.error(`Error in fetcher from etherscan: ${error}`);
            // logger.error({ status, message, result });
            throw { status, message, result };
        }

        if (status != 1) {
            logger.error(`etherscan status: ${status}. ${result}. returning a 500`);
            // probably" Max rate limit reached", 5/sec
            logger.error({ status, message, result });
            throw { status, message, result };
        }

        totalResult.push(...result);
    }

    const mintEventsFullData: NftEvent[] = totalResult.filter(
        (event: NftEvent) => event.from === blackholeAddress,
    ); // only mint events

    const dateStr = tsToMonthAndYear(mintEventsFullData[0].timeStamp);

    const mintEvents = mintEventsFullData.map(
        ({ tokenSymbol, contractAddress, tokenName, count }) => ({
            tokenSymbol,
            contractAddress,
            tokenName,
            count,
        }),
    );

    const creatorMap = {
        BBLOCK: 'The Metagame',
        LOOT: 'Dom Hoffman',
    };

    const nfts: NFTs = mintEvents.reduce((newEventObj, event) => {
        if (newEventObj[event.contractAddress]) {
            newEventObj[event.contractAddress].count += 1;
        } else {
            newEventObj[event.contractAddress] = event;
            newEventObj[event.contractAddress].count = 1;

            // add creator for special tokens
            if (creatorMap[event.tokenSymbol]) {
                newEventObj[event.contractAddress].creator = creatorMap[event.tokenSymbol];
            }
            delete event.contractAddress;
        }

        return newEventObj;
    }, {});

    return [nfts, dateStr];
}

export type Metadata = {
    name: string;
    description: string;
    image: string; //
    external_url: string; // tokengarden.art/garden/[tokenId]
    address: string;
    uniqueNFTCount: number;
    totalNFTCount: number;
    nfts: NFTs;
};

export function formatMetadata(
    minterAddress: string,
    nfts: NFTs,
    dateStr: string,
    userName: string,
    tokenId: string,
): Metadata {
    const uniqueNFTCount = Object.keys(nfts).length;

    const metadata: Metadata = {
        name: `${userName}'s Token Garden`,
        description: `A garden that's been growning since ${dateStr}. It has ${uniqueNFTCount} flowers so far.`,
        image: `https://${WEBSITE_URL}/growing.png`,
        external_url: `https://${WEBSITE_URL}/garden/${tokenId}`,
        address: minterAddress,
        uniqueNFTCount,
        totalNFTCount: Object.values(nfts).reduce((t, n) => t + n.count, 0),
        nfts,
    };

    return metadata;
}

// birthblock.art/api/v1/metadata/[tokenId]
export type OpenSeaMetadata = {
    name: string;
    description: string;
    image: string; // birthblock.art/api/v1/image/[tokenId]
    external_url: string; // birthblock.art/birthblock/[tokenId]
    attributes: [
        // properties
        {
            trait_type: 'address';
            value: string;
        },
    ];
};

export function metadataToOpenSeaMetadata(metadata: Metadata): OpenSeaMetadata {
    const openseaMetadata: OpenSeaMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        external_url: metadata.external_url,
        attributes: [
            // properties
            {
                trait_type: 'address',
                value: metadata.address,
            },
        ],
    };

    return openseaMetadata;
}

export async function getMetadata(tokenIdOrAddress: string): Promise<Metadata> {
    const metadata = await ioredisClient.hget(tokenIdOrAddress.toLowerCase(), 'metadata');

    if (!metadata) {
        throw new Error(`tokenId Or Address ${tokenIdOrAddress} not found`);
    }

    return JSON.parse(metadata);
}

export async function getTokenIdForAddress(address: string): Promise<string> {
    const tokenId = await ioredisClient.hget(address.toLowerCase(), 'tokenId');

    if (!tokenId) {
        throw new Error(`tokenId for address ${address} not found`);
    }

    return tokenId.toString();
}
