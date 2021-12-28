import Chance from 'chance';

const randomFlowers = ['Amaryllis', 'Hydrangea', 'Periwinkle', 'Poppy'];
const specificFlowers = ['Hydrangea', 'Periwinkle', 'Poppy'];
const allFlowers = randomFlowers.concat(specificFlowers);

// periwinkle, hydrangea,

const metagameFlowerColors = ['cyan', 'purple', 'greenyellow'];
const standardFlowerColors = ['deepblue', 'lightblue', 'magenta', 'peach', 'pink', 'yellowgreen'];
const randomFlowerColors = metagameFlowerColors.concat(standardFlowerColors);
const domFlowerColors = ['red'];
const allFlowerColors = randomFlowerColors.concat(domFlowerColors);
type Coords = [number, number, number];

const layout1 = [90, 120, 60, 150, 30, 180, 0];

const layout2 = [105, 75, 135, 45, 165, 15];

export const order1 = layout1.concat(layout2);
const order2 = layout2.concat(layout1);

const oneOrder = order1.concat(order1).concat(order2).concat(order2);
const totalOrder = oneOrder.concat(oneOrder).concat(oneOrder).concat(oneOrder);
const totalFlowers = [];
const flowers = ['Periwinkle', 'Amaryllis', 'Poppy', 'Cannalilly'];

totalFlowers.push(...Array(7).fill(flowers[0]));
totalFlowers.push(...Array(6).fill(flowers[1]));
totalFlowers.push(...Array(7).fill(flowers[2]));
totalFlowers.push(...Array(6).fill(flowers[3]));

totalFlowers.push(...Array(6).fill(flowers[0]));
totalFlowers.push(...Array(7).fill(flowers[1]));
totalFlowers.push(...Array(6).fill(flowers[2]));
totalFlowers.push(...Array(7).fill(flowers[3]));

totalFlowers.push(...Array(7).fill(flowers[0]));
totalFlowers.push(...Array(6).fill(flowers[1]));
totalFlowers.push(...Array(7).fill(flowers[2]));
totalFlowers.push(...Array(6).fill(flowers[3]));

totalFlowers.push(...Array(6).fill(flowers[0]));
totalFlowers.push(...Array(7).fill(flowers[1]));
totalFlowers.push(...Array(6).fill(flowers[2]));
totalFlowers.push(...Array(7).fill(flowers[3]));

const positionScale = [3, 6, 9, 12];

export function getFlowerName(randomFlowerNumber = 1, nftCount: number) {
    const flower = totalFlowers[randomFlowerNumber];
    return flower;
}
export function getRandomFlowerCoords(randomFlowerNumber, flower: string) {
    const degree = totalOrder[randomFlowerNumber];
    let coords = degreeToCoords(degree);
    coords = coordMultiplier(coords, flower);
    return coords;
}

export function getSpecialFlowerCoords(randomFlowerNumber = 1, flower: string) {
    const degree = totalOrder[randomFlowerNumber];
    let coords = degreeToCoords(degree);
    return coords;
}

export function degreeToCoords(degree: number): [number, number, number] {
    const radian = degree * (Math.PI / 180);
    const x = Math.cos(radian);
    const z = Math.sin(radian);
    const y = 0;
    return [x, y, z];
}

export function colorToDegree(color: string, colorOptions: string[]): number {
    const max = 360;
    const index = colorOptions.indexOf(color);
    return index * (max / colorOptions.length);
}

export function getColorOptions(flowerName: string): string[] {
    if (flowerName === 'Hydrangea') {
        return standardFlowerColors;
    } else if (flowerName === 'Periwinkle' || flowerName === 'Poppy') {
        return allFlowerColors;
    } else {
        throw new Error(`Unknown flower name: ${flowerName}`);
    }
}

export function coordMultiplier(coords: Coords, flowerName: string): Coords {
    return coords.map((c) => c * positionScale[flowers.indexOf(flowerName)]) as Coords;
}

export function getPosition(flowerName: string, color: string): Coords {
    if (!specificFlowers.includes(flowerName)) {
        return null;
    }
    const colorOptions = getColorOptions(flowerName);
    const degree = colorToDegree(color, colorOptions);
    let coords = degreeToCoords(degree);
    coords = coordMultiplier(coords, flowerName);
    return coords;
}

const getRandom = (contractAddress: string, options: string[]) => {
    const chance = new Chance(contractAddress);
    const index = chance.integer({ min: 0, max: options.length - 1 });
    return options[index];
};

const getSizeAndStem = (count: number): [string, string] => {
    switch (count) {
        case 1:
        // return ['baby', 'short'];
        case 2:
            return ['OG', 'normal'];
        case 3:
            return ['bush', 'short'];
        case 4:
        // return ['bush', 'normal'];
        default:
            return ['bush', 'long'];
    }
};

function getRandomPosition(contractAddress: string, tracking): Coords {
    const max = 10;
    const min = -1 * max;

    const chanceX = new Chance(contractAddress);
    const chanceZ = new Chance(contractAddress.split('').reverse().join(''));

    const x = chanceX.floating({ min: min, max: max });
    const z = chanceZ.floating({ min: min, max: max });
    tracking.push([x, z]);

    return [x, 0, z];
}
