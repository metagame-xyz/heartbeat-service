import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
    defaultMainnetProvider,
    defaultProvider,
    fetcher,
    getUserName,
    ioredisClient,
    isValidEventForwarderSignature,
    logger,
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
import { formatMetadata, getNFTData, Metadata, NFTs } from '@utils/metadata';
import { activateUrlbox } from '@utils/urlbox';

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
    const userName = await getUserName(defaultMainnetProvider, minterAddress);

    let metadata: Metadata;
    try {
        metadata = await formatMetadata(minterAddress, nfts, dateStr, userName);
    } catch (error) {
        logger.error(error);
        return res.status(500).send(error);
    }

    // logger.info(metadata);

    const trimmedData = {
        userName,
        uniqueNFTCount: metadata.uniqueNFTCount,
        totalNFTCount: metadata.totalNFTCount,
        address: metadata.address,
    };

    let jsonData = fs.readFileSync('minterExamples.json', 'utf-8');
    const data: Array<any> = JSON.parse(jsonData);
    data.sort((a, b) => {
        return b.uniqueNFTCount - a.uniqueNFTCount;
    });
    // data.push(trimmedData);
    fs.writeFileSync('minterExamples.json', JSON.stringify(data));

    res.status(200).send({
        minterAddress,
        tokenId,
        ensName: userName,
        status: 1,
        message: 'success',
        result: { minterAddress, tokenId, ensName: userName },
    });
}
