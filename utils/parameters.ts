import { SingleNetworkTxnCounts, TxnCounts } from './metadata';

const timeParamMax = {
    day: 12,
    week: 72,
    month: 144,
    total: 12 ** 3, //log144, 144**2, so that log144(x) = 2
};

export type Parameters = {
    speed: number;
    spikes: number;
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

    // console.log(`${timeFrame} vals`, vals);

    return Math.max(...vals);
}

function easeOut(n, max, stength) {
    const x = n / max;
    return x >= 1 ? 1 : 1 - Math.pow(2, -1 * stength * x);
}

function generateParamValue(txnCounts: TxnCounts, timeFrame: TimeFrames, strength = 0) {
    let count = getMax(txnCounts, timeFrame);

    if (strength) {
        return easeOut(count, timeParamMax[timeFrame], strength);
    }
    const percent = count / timeParamMax[timeFrame];
    // console.log(`${timeFrame} percent`, percent);
    const min = Math.min(1, percent);
    // console.log(`${timeFrame} min`, min);
    return min;
}

function generateActivityValue(SingleNetworkTxnCounts: SingleNetworkTxnCounts, ethereum = false) {
    const count = SingleNetworkTxnCounts.transactionsLastWeek;
    const normalizedCount = ethereum ? count : count / 3;

    return Math.min(1, normalizedCount / timeParamMax.week);
}

export function getParametersFromTxnCounts(txnCounts: TxnCounts) {
    const parameters: Parameters = {
        intensity: generateParamValue(txnCounts, 'day'),
        speed: generateParamValue(txnCounts, 'week', 5),
        contrast: generateParamValue(txnCounts, 'month'),
        spikes: generateParamValue(txnCounts, 'total', 10),
        // spikes: generateParamValue(txnCounts, 'week'),
        avalancheActivity: generateActivityValue(txnCounts.avalanche),
        fantomActivity: generateActivityValue(txnCounts.fantom),
        polygonActivity: generateActivityValue(txnCounts.polygon),
        ethereumActivity: easeOut(txnCounts.ethereum.transactionsLastMonth, timeParamMax.month, 3),
    };

    return parameters;
}
