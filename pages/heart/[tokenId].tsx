// import { AspectRatio, Box, Center, SimpleGrid, Stack, Wrap, WrapItem } from '@chakra-ui/react';
// import { InferGetServerSidePropsType } from 'next';
// import { useEffect, useState } from 'react';

// import Heart from '@components/Heart';

// import { ioredisClient } from '@utils';
// import HeartGrower from '@utils/Heart';
// import { Metadata } from '@utils/metadata';

// export const getServerSideProps = async (context) => {
//     const { tokenId } = context.query;
//     const metadata = await ioredisClient.hget(tokenId, 'metadata');
//     return {
//         props: {
//             metadata,
//             tokenId,
//         },
//     };
// };

// function HeartPage({
//     tokenId,
//     metadata: metadataStr,
// }: InferGetServerSidePropsType<typeof getServerSideProps>) {
//     const [metadata, setMetadata] = useState<Metadata | null>(JSON.parse(metadataStr));
//     // const [attributes, setAttributes] = useState({});
//     useEffect(() => {
//         async function growHeart() {
//             let wrapperEl = document.getElementById('heart');
//             while (wrapperEl.firstChild) {
//                 wrapperEl.removeChild(wrapperEl.firstChild);
//             }

//             const metadata: Metadata = JSON.parse(metadataStr);
//             setMetadata(metadata);
//             console.log(metadata);

//             const heart = new HeartGrower(wrapperEl);
//             heart.renderHeart(metadata);
//             // garden.addGUI();

//             // const metadataArray = Object.entries(metadata);
//         }
//         growHeart();
//     }, []);

//     const keysToKeep = [
//         'name',
//         'description',
//         'address',
//         // 'txnCounts',
//         'networkCounts',
//         'beatsPerMinute',
//     ];
//     const attributes = (metadata) => {
//         return (
//             <>
//                 {Object.entries(metadata)
//                     .filter(([v, k]) => keysToKeep.includes(v))
//                     .map(([key, value]) => {
//                         console.log('key', key);
//                         console.log('value', value);
//                         return (
//                             <>
//                                 <p key={key}>
//                                     {key}: {value}
//                                 </p>
//                             </>
//                         );
//                     })}
//             </>
//         );
//     };
//     return (
//         <Box align="center" p="16px" minH="calc(100vh - 146px)">
//             <SimpleGrid minChildWidth={[200, 400, 400, 400]} spacing={4}>
//                 <AspectRatio ratio={1}>
//                     <Box alignSelf="center" id="heart" bgColor="grey" w="auto"></Box>
//                 </AspectRatio>
//                 <AspectRatio ratio={1}>
//                     <Box id="not-heart" bgColor="#a0aec0">
//                         <Box>{attributes(metadata)}</Box>
//                     </Box>
//                 </AspectRatio>
//             </SimpleGrid>
//         </Box>
//     );
// }

// export default HeartPage;

const HeartPage = () => <div>Hello</div>;
export default HeartPage;
