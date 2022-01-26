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
        white: '#F7FAFC',
        brand: {
            // '100opaque': 'rgba(233, 216, 253, 0.92)',
            '100opaque': 'rgba(237,242,247, 0.92)',
            '50': '#F7FAFC',
            '100': '#EDF2F7',
            '200': '#E2E8F0',
            '300': '#CBD5E0',
            '400': '#A0AEC0',
            '500': '#718096',
            '600': '#4A5568',
            '700': '#2D3748',
            '800': '#1A202C',
            '900': '#171923',
            // '50': '#FFF5F7',
            // '100': '#FED7E2',
            // '200': '#FBB6CE',
            // '300': '#F687B3',
            // '400': '#ED64A6',
            // '500': '#D53F8C',
            // '600': '#B83280',
            // '700': '#97266D',
            // '800': '#702459',
            // '900': '#521B41',
        },
    },
    fonts: {
        heading: 'Lato',
        body: 'Lato',
    },
});
