import type { NextApiRequest, NextApiResponse } from 'next';

import { addOrUpdateNft } from '@utils/addOrUpdateNft';
import { getAddressForTokenId } from '@utils/metadata';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { tokenId } = req.query;
    const tokenIdString: string = Array.isArray(tokenId) ? tokenId[0] : tokenId;

    const address = await getAddressForTokenId(tokenIdString);

    const response = await addOrUpdateNft(address, tokenIdString);

    // const openseaMetadata = metadataToOpenSeaMetadata(JSON.parse(metadata));
    res.send(response);
    // res.send({});
}
