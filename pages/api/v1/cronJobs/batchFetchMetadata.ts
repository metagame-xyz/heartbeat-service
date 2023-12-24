export {};
// import { BigNumber, Contract } from 'ethers';
// import { CronJob } from 'quirrel/next';

// import updateMetadata from '@api/queues/updateMetadata';

// import { defaultProvider } from '@utils';
// import { CONTRACT_ADDRESS } from '@utils/constants';
// import { LogData, logError, logSuccess } from '@utils/logging';

// import heartbeat from '../../../../heartbeat.json';

// const jobSpacingInSeconds = 15;

// export default CronJob(
//     'api/v1/cronJobs/batchFetchMetadata', // 👈 the route it's reachable on
//     ['0 3 * * *', 'America/Chicago'], // 👈 the cron schedule
//     async () => {
//         const logData: LogData = {
//             function_name: 'BatchFetchMetadata',
//         };

//         try {
//             const heartbeatContract = new Contract(
//                 CONTRACT_ADDRESS,
//                 heartbeat.abi,
//                 defaultProvider,
//             );
//             logData.third_party_name = 'ethers';
//             const mintCountBN: BigNumber = await heartbeatContract.mintedCount();
//             const mintCount = mintCountBN.toNumber();

//             // array of tokenIds to update metadata for [1... mintCount]
//             const jobs = [...Array(mintCount + 1).keys()].slice(1).map((id) => {
//                 return {
//                     payload: { tokenId: id.toString() },
//                     options: { id: id.toString(), delay: `${id * jobSpacingInSeconds}s` },
//                 };
//             });

//             logData.third_party_name = 'quirrel';
//             const jobDataArr = await updateMetadata.enqueueMany(jobs);
//             logData.job_data = jobDataArr[jobDataArr.length - 1];
//             logSuccess(logData, `${jobDataArr.length} jobs enqueued`);
//         } catch (error) {
//             logError(logData, error);
//         }
//     },
// );
