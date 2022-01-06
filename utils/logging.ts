import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import winston, { format } from 'winston';

import { LOGTAIL_SOURCE_TOKEN } from './constants';

// Create a Logtail client
const logtail = new Logtail(LOGTAIL_SOURCE_TOKEN);

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const devFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => `${info.level}: ${info.message}`),
);

const ignoreDebug = format((info) => {
    if (info.level === 'debug') {
        return false;
    }
    return info;
});

const prodFormat = winston.format.combine(
    ignoreDebug(),
    winston.format.colorize({ all: true }),
    winston.format.simple(),
);
const devTransport = new winston.transports.Console();
const prodTransport = new LogtailTransport(logtail);

const prodEnv = process.env.NODE_ENV === 'production';

// Create a Winston logger - passing in the Logtail transport
export const logger = winston.createLogger({
    format: prodEnv ? prodFormat : devFormat,
    transports: [prodEnv ? prodTransport : devTransport],
});

// // Log as normal in Winston - your logs will sync with Logtail.com!
// logger.log({
//     level: 'info', // <-- will use Logtail's `info` log level,
//     message: 'Some message', // <-- will also be passed to Logtail
// });

export type LogDatawithoutLevel = {
    retry_needed?: boolean;
    attempt_number?: number;
    error_code?: number;
    message: string;
    third_party_name?: string;
    wallet_address?: string;
    token_id?: string;
    function_name?: string;
    thrown_error?: any;
};
export type LogDataWithLevel = {
    level: string;
    retry_needed?: boolean;
    attempt_number?: number;
    error_code?: number;
    message: string;
    third_party_name?: string;
    wallet_address?: string;
    token_id?: string;
    function_name?: string;
    thrown_error?: any;
};

export type LogData = LogDataWithLevel | LogDatawithoutLevel;

// class LogData {
//     constructor(
//         public message: string,
//         public label: string,
//     ) {

//     }
// }
