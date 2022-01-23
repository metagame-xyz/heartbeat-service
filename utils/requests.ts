import {
    CONTRACT_ADDRESS,
    networkScanAPIKeys,
    networkStrings,
    OPENSEA_API_KEY,
    productionNetworkApiURLs,
    ProductionNetworks,
} from './constants';
import { LogData, logError, logSuccess, logWarning } from './logging';

const fetchOptions = {
    // retry: 4,
    // pause: 1000,
    // callback: (retry: any) => {
    //     logWarning(fetchRetryLogData, `retry #${retry}`);
    // },
    body: null,
};

const isProd = process.env.VERCEL_ENV === 'production';

export const openseaFetchOptions = isProd
    ? {
          ...fetchOptions,
          headers: {
              'X-API-KEY': OPENSEA_API_KEY,
          },
      }
    : fetchOptions;

export class FetcherError extends Error {
    status: any;
    statusText: any;
    url: any;
    bodySent: any;
    constructor({ message, status, statusText, url, bodySent }) {
        super(message);
        this.name = 'Fetcher Error';
        this.status = status;
        this.statusText = statusText;
        this.url = url;
        this.bodySent = bodySent;
    }
    toJSON() {
        return {
            name: this.name,
            status: this.status,
            statusText: this.statusText,
            url: this.url,
            bodySent: this.bodySent,
            message: this.message,
        };
    }
}

const fetcherLogData: LogData = {
    level: 'error',
    function_name: 'fetcher',
    message: 'null??',
};

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function fetcher(url: string, options = fetchOptions) {
    let retry = 3;
    while (retry > 0) {
        const response: Response = await fetch(url, options);
        if (response.ok) {
            return response.json() as Promise<any>;
        } else {
            const error = {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                bodySent: options.body ? JSON.parse(options.body) : null,
                message: await response.text(),
            };
            fetcherLogData.thrown_error = error;
            logWarning(fetcherLogData, 'fetcher retry warning');
            retry--;
            if (retry === 0) {
                logError(fetcherLogData, error);
                throw new FetcherError(error);
            }
            await sleep(2000);
        }
    }
}

export async function forceUpdateOpenSeaMetadata(tokenId, forceMainnet = false): Promise<any> {
    const networkString = forceMainnet ? 'api.' : networkStrings.openseaAPI;
    const url = `https://${networkString}opensea.io/api/v1/asset/${CONTRACT_ADDRESS}/${tokenId}/?force_update=true`;
    return fetcher(url, openseaFetchOptions);
}

async function getSinglePageOfTransactions(
    address: string,
    network: ProductionNetworks,
    page: number,
): Promise<any> {
    const productionNetworkURL = productionNetworkApiURLs[network];
    const queryParams = new URLSearchParams({
        page: page.toString(),
        module: 'account',
        action: 'txlist',
        address,
        startblock: '0',
        endblock: 'latest',
        sort: 'desc',
        offset: '1000',
        apikey: networkScanAPIKeys[network],
    });
    const url = `https://${productionNetworkURL}/api?${queryParams.toString()}`;
    return await fetcher(url);
}

export async function getAllTransactions(
    address: string,
    network: ProductionNetworks,
    token_id = null,
): Promise<any[]> {
    const logData = {
        wallet_address: address,
        function_name: 'getAllTransactions',
        third_party_name: network as string,
        token_id,
    };

    let page = 1;
    let eventsInLastPage = 1000;

    let totalResult = [];

    while (eventsInLastPage === 1000) {
        let status, message, result;
        try {
            ({ status, message, result } = await getSinglePageOfTransactions(
                address,
                network,
                page,
            ));
            eventsInLastPage = result.length;
            page++;
        } catch (error) {
            error.page = page;
            logError(logData, error);
            // logger.error({ status, message, result });
            throw error;
        }

        if (message != 'No transactions found' && status != 1) {
            logError(logData, { status, message, result });
            throw { status, message, result };
        }

        totalResult.push(...result);
    }

    logSuccess(logData, `success ${network}`);

    return totalResult;
}
