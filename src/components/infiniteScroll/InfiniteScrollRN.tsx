import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Dimensions, FlatList, StyleSheet, Pressable, ActivityIndicator, Animated, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LogoWildfireLit } from '../logos/LogoFireLit';
import { useFeed } from '../../hooks/useFeed';
import { useIsFocused } from '@react-navigation/native';
import InfiniteScrollItem from './InfiniteScrollItem';
import { Livepeer } from 'livepeer';

export default function InfiniteScrollRN() {
  const router = useRouter();
  const isFocused = useIsFocused(); // Get focused state

  const livepeer = new Livepeer({
    apiKey: process.env.EXPO_PUBLIC_LIVEPEER_API_KEY,
  });

  //FETCH DIRECTLY
  const { isLoading, feed, fetchMore, refetch } = useFeed();

  // FIGURE OUT WHICH VIDEO IS IN USER'S VIEW TO PLAY
  const [playingIndex, setPlayingIndex] = useState<any>(null);
  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setPlayingIndex(viewableItems[0].index);
    }
  };
  const viewabilityConfigCallbackPairs = useRef([{ viewabilityConfig, onViewableItemsChanged }]);

  // HANDLE END REACHED
  const handleEndReached = () => {
    if (!isLoading) {
      fetchMore();
    }
  };

  // HANDLE REFRESH
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true); // Set refreshing state to true
    refetch(); // Refetch data
    setRefreshing(false); // Set refreshing state back to false
  };

  // HANDLE BACK (EXIT SCREEN)
  const handleBack = () => {
    setPlayingIndex(null);
    router.back();
  };

  const renderItem = useCallback(({ item , index } : any) => (
    <InfiniteScrollItem
            item={item}
            isPlaying={index === playingIndex} />
  ), [playingIndex]);

  return (
    <View className='flex-1'>
      {/* VIDEO FEED */}
      <FlatList
        data={feed}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        refreshing={refreshing} // Set the refreshing state
        onRefresh={handleRefresh} // Handle refresh
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (isLoading ? <ActivityIndicator size="small" color="#000" /> : null)}
      />

      {/* BACK BUTTON */}
      <SafeAreaView className='absolute'>
        <View className="flex-row items-center justify-between w-full px-3">
          <Pressable onPress={handleBack} className='flex-row items-center'>
            <Ionicons name="chevron-back" size={18} color="#F10849" />
            <LogoWildfireLit />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** 
 * SKORT STYLES
 * Css for skorts
 * **/
const styles = StyleSheet.create({
  videoContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playIconContainer: {
    ...StyleSheet.absoluteFillObject, // Position the play icon container absolutely within the video container
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
