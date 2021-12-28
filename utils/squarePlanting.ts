import Chance from 'chance';

const totalFlowers = [];
const flowers = ['Periwinkle', 'Amaryllis', 'Cannalilly'];

const order4 = [4, -4, 8, -8, 12, -12, 16, -16, 20, -20, 26, -26];
const order6 = [6, -6, 10, -10, 14, -14, 18, -18, 22, -22];
const order5 = [5, -5, 9, -9, 13, -13, 17, -17, 21, -21, 27, -27];
const order7 = [7, -7, 11, -11, 15, -15, 19, -19, 23, -23];

const totalOrder = order4
    .concat(order6)
    .concat(order5)
    .concat(order7)
    .concat(order5)
    .concat(order4)
    .concat(order6)
    .concat(order4)
    .concat(order7)
    .concat(order5)
    .concat(order7)
    .concat(order6);

totalFlowers.push(...Array(order4.length).fill(flowers[0]));
totalFlowers.push(...Array(order6.length).fill(flowers[0]));
totalFlowers.push(...Array(order5.length).fill(flowers[1]));
totalFlowers.push(...Array(order7.length).fill(flowers[2]));
totalFlowers.push(...Array(order5.length).fill(flowers[0]));
totalFlowers.push(...Array(order4.length).fill(flowers[1]));
totalFlowers.push(...Array(order6.length).fill(flowers[0]));
totalFlowers.push(...Array(order4.length).fill(flowers[0]));
totalFlowers.push(...Array(order7.length).fill(flowers[1]));
totalFlowers.push(...Array(order5.length).fill(flowers[2]));
totalFlowers.push(...Array(order7.length).fill(flowers[0]));
totalFlowers.push(...Array(order6.length).fill(flowers[1]));

const xScale = 0.2;
const zScale = 1;
type Coords = [number, number, number];

export function getFlowerName(randomFlowerNumber = 1, nftCount: number) {
    let flower = totalFlowers[randomFlowerNumber];
    if (Math.abs(totalOrder[randomFlowerNumber]) >= 25) {
        flower = 'Poppy';
    }

    return flower;
}

function getRandomFlowerX(randomFlowerNumber, flower: string) {
    const col = totalOrder[randomFlowerNumber];
    // const jitter = Math.random() * 0.1;
    return xScale * totalOrder[randomFlowerNumber];
}

function randomToRow(randomFlowerNumber) {
    const thresholds = [12, 22, 34, 44, 56, 68, 78, 90, 100, 112, 122, 132];
    const rows = [1, 3, 5, 9, 2, 7, 1, 3, 5, 9, 2, 7];

    if (randomFlowerNumber < thresholds[0]) {
        return rows[0];
    }
    if (randomFlowerNumber < thresholds[1]) {
        return rows[1];
    }
    if (randomFlowerNumber < thresholds[2]) {
        return rows[2];
    }
    if (randomFlowerNumber < thresholds[3]) {
        return rows[3];
    }
    if (randomFlowerNumber < thresholds[4]) {
        return rows[4];
    }
    if (randomFlowerNumber < thresholds[5]) {
        return rows[5];
    }
    if (randomFlowerNumber < thresholds[6]) {
        return rows[6];
    }
    if (randomFlowerNumber < thresholds[7]) {
        return rows[7];
    }
    if (randomFlowerNumber < thresholds[8]) {
        return rows[8];
    }
    if (randomFlowerNumber < thresholds[9]) {
        return rows[9];
    }
    if (randomFlowerNumber < thresholds[10]) {
        return rows[10];
    }
    if (randomFlowerNumber < thresholds[11]) {
        return rows[11];
    }
}

function getRandomFlowerZ(randomFlowerNumber, flower: string): number {
    const row = randomToRow(randomFlowerNumber);
    // const jitter = Math.random() * 0.1;
    return zScale * row;
}

export function getRandomFlowerCoords(randomFlowerNumber, flower: string): Coords {
    const x = getRandomFlowerX(randomFlowerNumber, flower);
    const y = 0;
    const z = getRandomFlowerZ(randomFlowerNumber, flower);

    return [x, y, z];
}

export const getSizeAndStem = (count: number): [string, string] => {
    switch (count) {
        case 1:
            // return ['OG', 'normal']
            return ['baby', 'short'];
        case 2:
            return ['bush', 'normal'];
            return ['OG', 'normal'];
        case 3:
            return ['bush', 'long'];
            return ['bush', 'short'];
        case 4:
            return ['bush', 'long'];
            return ['bush', 'normal'];
        default:
            return ['bush', 'long'];
    }
};

const color1 = ['yellowgreen', 'peach', 'pink'];
const color2 = ['lightblue', 'greenyellow', 'deepblue'];
const color3 = ['red', 'magenta', 'purple'];
const colors = [color1, color2, color3];

function pickColorSet(minterAddress) {
    const chance = new Chance(minterAddress);
    const index = chance.integer({ min: 0, max: 2 });
    return colors[index];
}

export const getRandomFlowerColor = (minterAddress: string, nftCount: number): string => {
    const colorSet = pickColorSet(minterAddress);
    switch (nftCount) {
        case 1:
            return colorSet[0];
        case 2:
            return colorSet[1];
        case 3:
            return colorSet[1];
        case 4:
            return colorSet[2];
        default:
            return colorSet[2];
    }
};

export function getSpecialFlowerCoords(position: [number, number]): Coords {
    return [position[0] * xScale, 0, position[1] * zScale];
}
