import type { NextApiRequest, NextApiResponse } from 'next';

import { defaultMainnetProvider, getUserName, logger } from '@utils';
import { formatMetadata, getNFTData, Metadata, NFTs } from '@utils/metadata';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { address } = req.query;
    const addressString: string = Array.isArray(address) ? address[0] : address;

    /****************/
    /* GET NFT DATA */
    /****************/
    let nfts: NFTs, dateStr: string;
    try {
        [nfts, dateStr] = await getNFTData(addressString);
    } catch (error) {
        logger.error(error);
    }

    // this will log an error if it fails but not stop the rest of this function
    const userName = await getUserName(defaultMainnetProvider, addressString);

    let metadata: Metadata;
    try {
        metadata = await formatMetadata(addressString, nfts, dateStr, userName);
    } catch (error) {
        logger.error(error);
    }

    res.send(metadata);
}
