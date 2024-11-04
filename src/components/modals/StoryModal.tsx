import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text } from 'react-native';
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  Image,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  cross,
  logo,
  mute,
  pause,
  play,
  unmute,
} from '../../utils/exportedFunction';
import Video from 'react-native-video';
import { Avatar } from '../avatars/avatar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { TimeAgo } from '../TimeAgo';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { increment_views } from '../../utils/views/incrementViews';
import { useAuth } from '../../services/providers/AuthProvider';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Livepeer } from 'livepeer';

type Props = {
  visible: boolean;
  data: any;
  storyIndex?: number;
  onClose: any;
};

const { width } = Dimensions.get('window');

export default function StoryModal({ visible, data, storyIndex, onClose }: Props) {

  //COSUME PROVIDERS
  const { user } = useAuth();

  const [currentStoryIndex, setCurrentStoryIndex] = useState(storyIndex || 0);
  const currentStory = data.feed[currentStoryIndex];
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pausedProgress = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [wentBack, setWentBack] = useState(0);
  const [temporaryFollowed, setTemporaryFollowed] = useState(false);
  const [playbackInfo, setPlaybackInfo] = useState<any>(null);

  const livepeer = new Livepeer({
    apiKey: process.env.EXPO_PUBLIC_LIVEPEER_API_KEY,
  });

  const handleIncrementViews = async (story: any) => {
    increment_views(story.id);
  }

  const renderStoryContent = (story: any) => {

    handleIncrementViews(story);

    // Set fallback URI if playbackInfo equals "error"
  const videoUri = playbackInfo === "error" 
  ? story.video_url
  : playbackInfo;

    return (
      <Video
        source={{ uri: videoUri }}
        resizeMode="cover"
        style={styles.backgroundImage}
        paused={isPaused}
        muted={isMuted}
      />
    );
  };

  const runProgressAnimation = () => {
    // this will run the animations at the top for the story
    progressAnim.setValue(pausedProgress.current); //set the value of the progress of the story
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: (1 - pausedProgress.current) * 3000, //for how long each story currently 3 seconds
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        goToNextStory(); //once finished goes to nextStory()
      }
    });
  };

  const getProgressBarWidth = (storyIndex: number, currentIndex: number) => {
    if (currentIndex > storyIndex) {
      return '100%';
    } // this is when the Story has been viewed
    if (currentIndex === storyIndex) {
      return progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'], // this is when the story is being viewed
      });
    }
    return '0%'; // this is when the Story has not been viewed yet
  };

  const goToPreviousStory = () => {
    if (isPaused) {
      setIsPaused(false);
    }
    pausedProgress.current = 0;
    progressAnim.setValue(0);
    if (currentStoryIndex === 0) {
      setWentBack(wentBack + 1);
      runProgressAnimation();
    } else {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const goToNextStory = () => {
    if (currentStoryIndex < data.feed.length - 1) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3,
        useNativeDriver: false,
      }).start(() => {
        pausedProgress.current = 0;
        setCurrentStoryIndex(currentStoryIndex + 1);
        progressAnim.setValue(0);
      });
    } else {
      setWentBack(0);
      onClose();
      setCurrentStoryIndex(0);
    }
  };

  const pausePlay = () => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  };

  const muteAndUnMute = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  };

  const handleReset = () => {
    onClose();
  };

  const handlePressIn = () => {
    setIsPaused(true);
  };

  const handlePressOut = () => {
    setIsPaused(false);
  };

  const handleScreenTouch = (evt: GestureResponderEvent) => {
    //this function takes the width and decided where the click was pressed if left or right
    const touchX = evt.nativeEvent.locationX;
    if (touchX < width / 2) {
      goToPreviousStory();
    } else {
      goToNextStory();
    }
  };

  const handleFollow = async () => {
    setTemporaryFollowed(true);
    const { error } = await supabase
      .from("followers")
      .insert({ follower_id: data.authUser?.id, following_id: data.user.id });
    if (!error) setTemporaryFollowed(true);
  }

  useEffect(() => {
    if (!isPaused) {
      runProgressAnimation();
    } else {
      progressAnim.stopAnimation(value => {
        pausedProgress.current = value;
      });
    }
  }, [currentStoryIndex, isPaused]);

  // Inside StoryModal component
useEffect(() => {
  const fetchPlaybackInfo = async () => {
    try {
      if (currentStory && currentStory.playback_id) {
        const info = await livepeer.playback.get(currentStory.playback_id);
        setPlaybackInfo(info.playbackInfo?.meta.source[0].url);
      }
    } catch (error) {
      //console.error("Error fetching playback info:", error);
      setPlaybackInfo("error");
    }
  };

  fetchPlaybackInfo();
}, [currentStoryIndex]);

  console.log("data.feed", data.feed);

  return (
    <Modal
      visible={visible}
      onRequestClose={() => handleReset()}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.safeArea}>
        <Pressable
          onPress={handleScreenTouch}
          onLongPress={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.container}>
          <View style={styles.container} className='bg-black/50 flex-1'>

            {/* STORY VIDEO */}
            {renderStoryContent(currentStory)}

            {/* TOP BAR */}
            <SafeAreaView>
              <View style={styles.progressBarContainer}>
                {data.feed.map((story: any, index: any) => (
                  <View key={index} style={styles.progressBarBackground}>
                    <Animated.View
                      style={[
                        styles.progressBar,
                        {
                          width: getProgressBarWidth(index, currentStoryIndex),
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
              <View style={styles.topBar}>
                <Image source={logo} style={styles.logo} />
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={() => muteAndUnMute()}>
                  <Image source={isMuted ? mute : unmute} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => pausePlay()}>
                  <Image source={isPaused ? play : pause} style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onClose()}>
                  <Image source={cross} style={styles.icon} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            {/* BOTTOM BAR */}
            <SafeAreaView className='absolute bottom-0 flex-row justify-between items-center w-full'>
              <LinearGradient className='absolute bottom-0 p-20 w-full' colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 1)']}></LinearGradient>

              {/* BOTTOM LEFT */}
              <Pressable className='flex-row items-center ml-3' onPress={() => {
                  router.push("/(profile)/" + currentStory.profile.username);
                  handleReset();
                }}>
                <Avatar avatar_url={currentStory.profile.avatar_url} username={currentStory.profile.username} size={'md'} ring={true} />
                <Text className='ml-2 mr-1 font-bold text-white text-base' style={styles.shadow}>{currentStory.profile.username}</Text>
                <Text className='text-white mr-1 text-base'><TimeAgo timestamp={currentStory.created_at}></TimeAgo></Text>
                {data.followed != null &&
                  <View className='ml-1'>
                    {
                      data.followed || temporaryFollowed ?
                        <View className='flex-row items-center bg-zinc-900/10 border rounded-xl border-white px-2 py-1'>
                          <Text className='text-white mr-1' style={styles.shadow}>Following</Text>
                          <FontAwesome5 name="check-circle" size={12} color="white" />
                        </View>
                        :
                        <TouchableOpacity className='bg-zinc-900/10 border rounded-xl border-white px-2 py-1' onPress={handleFollow}><Text className='text-white text-base' style={styles.shadow}>Follow</Text></TouchableOpacity>
                    }

                  </View>}
              </Pressable>

              {/* BOTTOM RIGHT */}
              {currentStory.country &&
                <View className='flex-row items-center rounded-full mr-3 bg-zinc-900/60 px-2 py-1'>
                  <FontAwesome name="location-arrow" size={14} color="white" />
                  <Text className='text-white ml-1 text-base' style={styles.shadow}>{currentStory.country.name}</Text>
                </View>
              }
            </SafeAreaView>
          </View>
        </Pressable>
      </View>
    </Modal>


  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 1,
    elevation: 5, // For Android
  },
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
    borderRadius: 18,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
    justifyContent: 'center',
    height: 3,
    backgroundColor: 'transparent',
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'white',
  },
  topBar: {
    position: 'absolute',
    left: 15,
    top: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  icon: {
    width: 25,
    height: 25,
    marginLeft: 10,
  },
  buttonContainer: {
    position: 'absolute',
    right: 10,
    top: 25,
    alignItems: 'center',
    flexDirection: 'row',
  },
});