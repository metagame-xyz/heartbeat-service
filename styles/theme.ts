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
        white: '#FFF5F7',
        brand: {
            '100opaque': 'rgba(233, 216, 253, 0.92)',
            '50': '#FFF5F7',
            '100': '#FED7E2', 
            '200': '#FBB6CE',
            '300': '#F687B3',
            '400': '#ED64A6',
            '500': '#D53F8C',
            '600': '#B83280',
            '700': '#97266D',
            '800': '#702459',
            '900': '#521B41',
        },
    },
    fonts: {
        heading: 'Lato',
        body: 'Lato',
    },
});
