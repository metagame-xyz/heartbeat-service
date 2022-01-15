import DatadogWinston from 'datadog-winston';
import winston, { format } from 'winston';

import { DATADOG_API_KEY } from './constants';

const { combine, printf, colorize } = format;

const colors = {
    error: 'red',
    warning: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const devFormat = printf((info) => `${info.level}: ${info.message}`);

const debugFormat = format.prettyPrint();

const prodFormat = printf(
    (d) =>
        `${d.level}: token_id ${d.token_id} | ${d.function_name} | ${
            d.third_party_name ? `${d.third_party_name} | ` : ''
        }${d.attempt_number ? `attempt ${d.attempt_number} | ` : ''}${d.message}`,
);
const localTransports = [new winston.transports.Console({ level: 'debug' })];

const datadogTransport = new DatadogWinston({
    apiKey: DATADOG_API_KEY,
    hostname: process.env.VERCEL_URL,
    service: 'token-garden-logger',
    ddsource: 'nodejs',
    ddtags: `env:${process.env.VERCEL_ENV}`,
});

const prodTransports = [datadogTransport];

const isProdEnv = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: isProdEnv ? prodFormat : combine(colorize(), prodFormat),
    transports: isProdEnv ? prodTransports : localTransports,
});

export const debugLogger = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: debugFormat,
    transports: isProdEnv ? prodTransports : localTransports,
});

export const debug = (message: any) => {
    debugLogger.debug(message);
};

export const logSuccess = (logData: LogData, message = 'success') => {
    const logDataCopy = { ...logData };
    logDataCopy.level = 'info';
    logDataCopy.message = message;
    logDataCopy.third_party_name = null;
    logger.log(logDataCopy);
};

export const logError = (logData: LogData, error: any) => {
    const logDataCopy = { ...logData };
    logDataCopy.level = 'error';
    logDataCopy.message = error?.message || 'error obj had no .message';
    logDataCopy.thrown_error = error;
    logger.log(logDataCopy);
};

export const logWarning = (logData: LogData, message = 'warning') => {
    const logDataCopy = { ...logData };
    logDataCopy.level = 'warning';
    logDataCopy.message = message;
    logDataCopy.alert = true;
    logger.log(logDataCopy);
};

export type LogData = {
    level: 'emerg' | 'alert' | 'crit' | 'error' | 'warning' | 'notice' | 'info' | 'debug';
    retry_needed?: boolean;
    attempt_number?: number;
    error_code?: number;
    message: any;
    third_party_name?: string;
    wallet_address?: string;
    token_id?: string;
    function_name?: string;
    thrown_error?: any;
    job_data?: any;
    alert?: boolean;
};
