import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
    styles: {
        global: {
            'html, body': {
                color: 'brand.900',
            },
        },
    },
    colors: {
        white: '#FAF5FF',
        brand: {
            '50': '#FAF5FF',
            '100': '#E9D8FD',
            '100opaque': 'rgba(233, 216, 253, 0.92)',
            '200': '#D6BCFA',
            '300': '#B794F4',
            '400': '#9F7AEA',
            '500': '#805AD5',
            '600': '#6B46C1',
            '700': '#553C9A',
            '800': '#44337A',
            '900': '#322659',
        },
    },
    fonts: {
        heading: 'Lato',
        body: 'Lato',
    },
});
