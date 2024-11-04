import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Dimensions, Pressable, Modal, Animated } from 'react-native';
import { useFeedFromCountry } from '@/src/hooks/useFeedFromCountry';
import StoryModal from '../modals/StoryModal';
import FeedCarouselItem from './FeedCarouselItem';

const CARD_WIDTH = Dimensions.get('window').width * 0.8;
const CARD_HEIGHT = 600
const MARGIN_LEFT = 0;
const MARGIN_RIGHT = 4;

function FeedCarouselByCountry() {

    // SET UP MASTER FEED
    const { feed: masterFeed, refetch: refetchFeed } = useFeedFromCountry(3);

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
    const [storyModalVisible, setStoryModalVisible] = useState(false);
    function openStory(storyFeed: any) {
        setStoryFeed(storyFeed);
        setStoryModalVisible(true);
        setPlayingIndex(null);
    }
    function closeStory() { setStoryModalVisible(false); }

    //OPTIMIZE FLATLIST
    const renderItem = useCallback(({ item, index }: any) => (
        <FeedCarouselItem
            playback_id={item.first_video_playback_id}
            video_url={item.first_video_url}
            time={item.country_name}
            onPress={() => openStory(item.data)}
            isPlaying={index === playingIndex}
        />
    ), [playingIndex]);

    return (
        <>
            {storyModalVisible && (
                <StoryModal visible={storyModalVisible} data={{feed: storyFeed}} onClose={closeStory} />
            )}
            {masterFeed &&
                (
                    <FlatList
                        data={masterFeed}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        snapToInterval={CARD_WIDTH + MARGIN_LEFT + MARGIN_RIGHT} // Calculate the size for a card including marginLeft and marginRight
                        decelerationRate="fast" // Make the scrolling feel snappier
                        contentContainerStyle={styles.container}
                        snapToAlignment="center" // Snap to the start of the card
                        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
                    />
                )}

        </>
    );
};
export default FeedCarouselByCountry;


/**
* STYLES
*/
const styles = StyleSheet.create({
    container: {
        height: CARD_HEIGHT
    },
});