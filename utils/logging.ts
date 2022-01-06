import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import winston, { createLogger } from 'winston';

import { LOGTAIL_SOURCE_TOKEN } from './constants';

// Create a Logtail client
const logtail = new Logtail(LOGTAIL_SOURCE_TOKEN);

// Create a Winston logger - passing in the Logtail transport
export const logger = createLogger({
    transports: [new LogtailTransport(logtail)],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    );
}

// // Log as normal in Winston - your logs will sync with Logtail.com!
// logger.log({
//     level: 'info', // <-- will use Logtail's `info` log level,
//     message: 'Some message', // <-- will also be passed to Logtail
// });
