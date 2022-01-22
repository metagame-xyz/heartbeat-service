import { Box } from '@chakra-ui/react';

function View() {
    // useEffect(() => {
    //     async function growHeart() {
    //         let wrapperEl = document.getElementById('heart');
    //         while (wrapperEl.firstChild) {
    //             wrapperEl.removeChild(wrapperEl.firstChild);
    //         }

    //         const metadata: Metadata = JSON.parse(metadataStr);
    //         // const minterAddress = metadata.address;

    //         const heart = new HeartGrower(wrapperEl);
    //         heart.renderHeart(metadata);

    //         // garden.addGUI();
    //     }
    //     growHeart();
    // }, []);

    // return <Box position="absolute" id="heart" bgColor="blue" w="400px" h="400px"></Box>;
    return (
        <Box position="absolute" id="heart" bgColor="blue" w="400px" h="400px">
            Hi Hello
        </Box>
    );
}

export default View;
