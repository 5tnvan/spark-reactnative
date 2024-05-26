import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Dimensions, Pressable, Modal } from 'react-native';
import { TimeAgo } from '../TimeAgo';
import Video from 'react-native-video';
import { useFeedFromTime } from '@/src/hooks/useFeedFromTime';
import { useIsFocused } from '@react-navigation/native';
import StoryComponent from '../StoryComponent';

const CARD_WIDTH = Dimensions.get('window').width * 0.8;
const CARD_HEIGHT = 600
const MARGIN_LEFT = 0;
const MARGIN_RIGHT = 4;

export default function FeedCarouselByTime() {
    const { isLoading, feed: masterFeed, refetch } = useFeedFromTime();
    
    // FIGURE OUT WHICH VIDEO IS PLAYING
    const [playingIndex, setPlayingIndex] = useState<any>(null);
    const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
    const onViewableItemsChanged = ({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setPlayingIndex(viewableItems[0].index);
        } else {
            setPlayingIndex(null);
        }
    };
    const viewabilityConfigCallbackPairs = useRef([{ viewabilityConfig, onViewableItemsChanged }]);

    // SET UP STORY COMPONENT
    const [storyFeed, setStoryFeed] = useState(null);
    const [insideStory, setInsideStory] = useState(false);
    function openStory(storyFeed: any) {
        setStoryFeed(storyFeed);
        setInsideStory(true);
        setPlayingIndex(null); //stop playing video when opening a story
        openModal();
    }
    function closeStory() { setInsideStory(false); closeModal() }

    // SET UP MODAL COMPONENT
    const [insideModal, setInsideModal] = useState(false);
    function openModal() { setInsideModal(true); }
    function closeModal() { setInsideModal(false); }

    // HANDLE WHEN SCREEN IS IN/OUT OF FOCUS
    const isFocused = useIsFocused();
    useEffect(() => {
        if (isFocused) { refetch(); } // refetch data when in focus
        else { setPlayingIndex(null); } // stop playing when out of focus
    }, [isFocused]);

    return (
        <>
            {insideStory && (
                <Modal
                    visible={insideModal}
                    onRequestClose={() => closeModal()}
                    animationType="slide"
                    presentationStyle="pageSheet"
                >
                    <StoryComponent data={storyFeed} onFinishStory={closeStory} />
                </Modal>
            )}
            {masterFeed && (
                <FlatList
                data={masterFeed}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => 
                <Item 
                    video_url={item.first_video.video_url} 
                    time={item.time}
                    onPress={() => openStory(item.data)} 
                    isPlaying={index === playingIndex}
                    />}
                snapToInterval={CARD_WIDTH + MARGIN_LEFT + MARGIN_RIGHT} // Calculate the size for a card including marginLeft and marginRight
                decelerationRate="fast" // Make the scrolling feel snappier
                contentContainerStyle={styles.container}
                snapToAlignment="center" // Snap to the start of the card
            />
            )}
        </>
    );
};

type Props = {
    time: any,
    video_url: any,
    isPlaying: any,
    onPress: any,
};

const Item = ({ time, video_url, isPlaying, onPress }: Props) => (
    <Pressable style={styles.card} onPress={onPress}>
        <Video
            source={{ uri: video_url }}
            resizeMode="cover"
            style={styles.backgroundImage}
            repeat={true}
            volume={0}
            paused={!isPlaying}
        />
        <View className='flex-row justify-end p-2 '>
            <View className='bg-zinc-800/70 py-1 px-3 rounded-full'>
                <Text className='text-base text-white font-medium mb-1'>{time}</Text>
            </View>
        </View>
    </Pressable>
);

const styles = StyleSheet.create({
    container: {
        // backgroundColor: '#444FFF',
        height: CARD_HEIGHT
    },
    card: {
        backgroundColor: '#fff',
        width: CARD_WIDTH,
        marginLeft: MARGIN_LEFT,
        marginRight: MARGIN_RIGHT,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
});