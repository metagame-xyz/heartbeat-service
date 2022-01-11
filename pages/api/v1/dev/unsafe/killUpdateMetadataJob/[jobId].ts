import type { NextApiRequest, NextApiResponse } from 'next';

import OpenseaForceUpdate from '@api/queues/openseaForceUpdate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { jobId } = req.query;
    const jobIdString: string = Array.isArray(jobId) ? jobId[0] : jobId;

    const jobData = await OpenseaForceUpdate.delete(jobIdString);
    res.send(jobData);
    // res.send({});
}
