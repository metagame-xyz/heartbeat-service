import { WEBSITE_URL } from '@utils/constants';

export interface MetaProps {
    description?: string;
    image?: string;
    title: string;
    type?: string;
}

export const headMetadata: MetaProps = {
    title: 'Token Garden',
    description: 'An ever-growing garden of flowers based on the NFTs you’ve minted',
    image: `https://${WEBSITE_URL}/site-preview.png`,
    type: 'website',
};

export const copy = {
    title: 'Token Garden',
    nameLowercase: 'token-garden',
    heroSubheading: 'An ever-growing 3D garden of flowers based on the NFTs you’ve minted',
    heading1: 'Continuously Growing',
    text1: 'Each time you mint an NFT, a flower will sprout or grow bigger in your garden.',
    heading2: 'Naturally Scarce',
    text2: 'The number, size, and color of flowers in your garden is based on your on-chain data instead of an artificial limit.',
    heading3: 'Minted, not Purchased',
    text3: 'Token Gardens are based on the NFTs you’ve minted, not purchased. You can’t buy your way to a full garden, you have to grow it!',
    bottomSectonHeading: 'The Metagame',
    bottomSectionText:
        'Token Garden is the second NFT in an infinite series of achievements you earn by playing a game many of us are already playing whether we know it or not: The Metagame. These earned achievements will allow access to private spaces gated by shared experiences. Each achievement will contribute to leveling up your character. Follow along: ',
};
