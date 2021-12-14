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
    const scale = [1, 2, 3];

    if (flowerName === 'Hydrangea') {
        return coords.map((c) => c * scale[0]) as Coords;
    } else if (flowerName === 'Poppy') {
        return coords.map((c) => c * scale[1]) as Coords;
    } else if (flowerName === 'Periwinkle') {
        return coords.map((c) => c * scale[2]) as Coords;
    } else {
        throw new Error(`Unknown flower name: ${flowerName}`);
    }
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
