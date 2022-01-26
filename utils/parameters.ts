import { SingleNetworkTxnCounts, TxnCounts } from './metadata';

const timeParamMax = {
    day: 12,
    week: 72,
    month: 144,
    total: 20736, //log144, 144**2, so that log144(x) = 2
};

export type Parameters = {
    speed: number;
    strength: number;
    // spikes: number;
    intensity: number;
    contrast: number;
    avalancheActivity: number;
    fantomActivity: number;
    polygonActivity: number;
    ethereumActivity: number;
};

type TimeFrames = 'total' | 'day' | 'week' | 'month';

function getMax(txnCounts: TxnCounts, timeFrame: TimeFrames) {
    const wordMap = {
        total: 'totalTransactions',
        day: 'transactionsYesterday',
        week: 'transactionsLastWeek',
        month: 'transactionsLastMonth',
    };

    // sidechains counts count as 1/3 transactions
    const vals = Object.entries(txnCounts).map(([network, vals]) =>
        network === 'ethereum' ? vals[wordMap[timeFrame]] : vals[wordMap[timeFrame]] / 3,
    );

    return Math.max(...vals);
}

function generateParamValue(txnCounts: TxnCounts, timeFrame: TimeFrames, log = false) {
    let count = getMax(txnCounts, timeFrame);

    if (log) {
        count = Math.log(count) / Math.log(timeParamMax.total);
    }
    return Math.max(1, count / timeParamMax[timeFrame]);
}

function generateActivityValue(SingleNetworkTxnCounts: SingleNetworkTxnCounts, ethereum = false) {
    const count = SingleNetworkTxnCounts.transactionsLastMonth;
    const normalizedCount = ethereum ? count : count / 3;

    return Math.max(1, normalizedCount / timeParamMax.month);
}

export function getParametersFromTxnCounts(txnCounts: TxnCounts) {
    const parameters: Parameters = {
        intensity: generateParamValue(txnCounts, 'day'),
        speed: generateParamValue(txnCounts, 'week'),
        contrast: generateParamValue(txnCounts, 'month'),
        strength: generateParamValue(txnCounts, 'total', true),
        // spikes: generateParamValue(txnCounts, 'week'),
        avalancheActivity: generateActivityValue(txnCounts.avalanche),
        fantomActivity: generateActivityValue(txnCounts.fantom),
        polygonActivity: generateActivityValue(txnCounts.polygon),
        ethereumActivity: generateActivityValue(txnCounts.ethereum, true),
    };

    return parameters;
}