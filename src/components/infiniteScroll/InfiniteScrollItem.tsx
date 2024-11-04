import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, TouchableOpacity, Linking, Dimensions, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Entypo, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Video from 'react-native-video';
import { PressableComment } from '../pressables/PressableComment';
import { PressableFire } from '../pressables/PressableFire';
import { PressableAvatarWithUsername } from '../pressables/PressableAvatarWithUsername';
import { PressableTip } from '../pressables/PressableTip';
import FormatNumber from '../FormatNumber';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { TimeAgo } from '../TimeAgo';
import { FontAwesome } from '@expo/vector-icons';
import { FiresModal } from '../modals/FiresModal';
import { CommentsModal } from '../modals/CommentsModal';
import { useAuth } from '../../services/providers/AuthProvider';
import { increment_views } from '../../utils/views/incrementViews';
import { ThreeDotsModal } from '../modals/ThreeDotsModal';
import { Livepeer } from 'livepeer';

function InfiniteScrollItem({ item, isPlaying }: any) {

    const livepeer = new Livepeer({
        apiKey: process.env.EXPO_PUBLIC_LIVEPEER_API_KEY,
      });

    const [playbackInfo, setPlaybackInfo] = useState<any>(null);

    console.log("item", item);

    const router = useRouter();
    const colorScheme = useColorScheme();
    const video = React.useRef<any>(null);

    //COSUME PROVIDERS
    const { user } = useAuth();

    //CHECK IF VIDEO IS BEING VIEWED
    //Handles play/pause based on isPlaying prop
    useEffect(() => {
        if (!video.current) return;

        if (isPlaying) { //it is in view, play
            video.current.seek(0);
            video.current.resume();
            setPaused(false); // Video is playing, so hide the play icon
        } else { // it is not in view, pause
            video.current.pause();
            video.current.seek(0);
        }
    }, [isPlaying]);

    //AFTER 3rd PLAY REPEAT, PAUSE VIDEO
    //const [repeatCount, setRepeatCount] = useState(0);
    const repeatCountRef = useRef(0);
    const [threePlayPaused, setThreePlayPaused] = useState(false);

    const handleThreePlayRepeat = () => {
        if (repeatCountRef.current < 2) {
            repeatCountRef.current += 1;
        } else {
            // Pause the video after 3rd repeat
            if (video.current) {
                video.current.seek(0);
                video.current.pause();
                setThreePlayPaused(true);
                fadeIn();
            }
        }
    };

    // HANDLE WATCH AGAIN
    const handleWatchAgain = () => {
        //incrementviews
        handleIncrementViews()
        //reset
        repeatCountRef.current = 0;
        setThreePlayPaused(false);
        fadeAnim.setValue(0);
        if (video.current) {
            video.current.resume();
        }
    };
    const fadeAnim = useRef(new Animated.Value(0)).current; // WATCH AGAIN FADE-IN ANIM
    const fadeIn = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    //WHEN VIDEO IS IN VIEW AGAIN, RESET
    // Resets repeat count and visibility of watch again button when item becomes active
    useEffect(() => {
        if (isPlaying) {
            handleIncrementViews();
            repeatCountRef.current = 0;
            setThreePlayPaused(false);
            fadeAnim.setValue(0);
        }
    }, [isPlaying]);

    // HANDLE MANUAL PAUSE
    const [paused, setPaused] = useState(false);

    const handleManualPause = () => {
        if (!threePlayPaused) {
            if (isPlaying && !paused) {
                video.current.pause();
                setPaused(true);
            } else {
                video.current.resume();
                setPaused(false);
            }

        }
    };

    //HANDLE LIKE PRESS
    const [likeCount, setLikeCount] = useState(item["3sec_fires"][0].count);
    const [temporaryLiked, setTemporaryLiked] = useState(false);
    const [firesModalVisible, setFiresModalVisible] = useState(false); //fires modal

    const handleLikePress = async () => {
        //if liked already, a modal will appear
        if (item.liked || temporaryLiked) {
            setFiresModalVisible(true);
            if (video.current) {
                video.current.pause();
            }
        } else {
            // Insert like to supabase
            const { data, error } = await supabase.from("3sec_fires").insert({
                video_id: item.id,
                user_id: user?.id,
                fire: true,
            });
            if (!error) {
                setTemporaryLiked(true); // Set temporary like state
                setLikeCount((prevCount: any) => prevCount + 1); // Increment like count
            }
        }
    };

    //HANDLE COMMENT PRESS
    const [commentModalVisible, setCommentModalVisible] = useState(false); //fires modal
    const [commentCount, setCommentCount] = useState(item["3sec_comments"][0].count);

    const handleCommentPress = async () => {
        setCommentModalVisible(true);
        // Pause the video when comment modal is opened
        if (video.current) {
            video.current.pause();
        }
    };

    //HANDLE INCREMENT VIEWS
    const handleIncrementViews = async () => {
        increment_views(item.id);
    }

    //HANDLE THREE DOTS
    const [threeDotsModalVisible, setThreeDotsModalVisible] = useState(false);
    const handleThreeDotsPress = () => {
        setThreeDotsModalVisible(true);
        // Pause the video when three dots modal is opened
        if (video.current) {
            video.current.pause();
        }
    }

    //HANLDE FOLLOW
    const [temporaryFollowed, setTemporaryFollowed] = useState(false);
    const handleFollow = async () => {
        console.log("follower_id", user?.id);
        console.log("following_id", item.profile.id);
        const { error } = await supabase
          .from("followers")
          .insert({ follower_id: user?.id, following_id: item.profile.id });
        if (!error) setTemporaryFollowed(true);
      }

      // Fetch playback info from playback_id
  useEffect(() => {
    const fetchPlaybackInfo = async () => {
      try {
        console.log("playback_id", item.playback_id);
        const info = await livepeer.playback.get(item.playback_id);
        setPlaybackInfo(info.playbackInfo?.meta.source[0].url); // Set the playback info state
      } catch (error) {
        console.error("Error fetching playback info:", error);
      }
    };

    if (item.playback_id) {
      fetchPlaybackInfo();
    }
  }, [item.playback_id]);

    return (
        <>
            <Pressable onPress={handleManualPause}>
                {/* FULL-SCREEN VIDEO */}
                <View style={styles.videoContainer}>
                    <Video
                        ref={video}
                        source={{ uri: playbackInfo }}
                        resizeMode="cover"
                        style={styles.video}
                        repeat={true}
                        onEnd={handleThreePlayRepeat}
                        paused={!isPlaying}
                    />
                </View>
                {/* WATCH AGAIN */}
                {threePlayPaused && (
                    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                        <Pressable className="bg-zinc-100/70 p-3 rounded-full flex-row" onPress={handleWatchAgain}>
                            <FontAwesome name="eye" size={24} color="black" />
                            <Text className="text-black text-base ml-1">Watch again</Text>
                        </Pressable>
                    </Animated.View>
                )}
                {/* PLAY ICON */}
                {paused && ( // Conditionally render the play icon overlay when video is paused
                    <View style={styles.playIconContainer} className='gap-2'>
                        <FontAwesome5 name="play" size={36} color="white" />
                    </View>
                )}
                {/* TOP */}
                <SafeAreaView className='absolute right-2 flex-row gap-1 items-center'>
                    {/* <TouchableOpacity className={`flex-row items-center rounded-full bg-white/70`}>
                        <View className='px-2 py-1'><FontAwesome name="eye" size={18} color="black" /></View>
                        <Text className='text-lg mr-2'><FormatNumber number={item["3sec_views"][0].view_count} /></Text>
                    </TouchableOpacity> */}
                    <Pressable onPress={handleThreeDotsPress}><Entypo name="dots-three-vertical" size={18} color={colorScheme == 'dark' ? 'white' : 'black'} /></Pressable>
                </SafeAreaView>
                {/* BOTTOM */}
                <LinearGradient className='absolute bottom-0 p-3 w-full' colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 1)']}>
                    <View className='flex-col items-center justify-between'>
                        <View className='flex-row items-center'>
                            <PressableAvatarWithUsername avatar_url={item.profile.avatar_url} username={item.profile.username} />
                            {item.followed != null &&
                  <View className='ml-1'>
                    {
                      item.followed || temporaryFollowed ?
                        <View className='flex-row items-center bg-zinc-900/10 border rounded-lg border-white px-2 py-0 ml-1'>
                          <Text className='text-white mr-1 text-base' style={styles.shadow}>Following</Text>
                          <FontAwesome5 name="check" size={10} color="white" />
                        </View>
                        :
                        <TouchableOpacity className='bg-zinc-900/10 border rounded-lg border-white px-2 py-0 ml-1' onPress={handleFollow}><Text className='text-white text-base' style={styles.shadow}>Follow +</Text></TouchableOpacity>
                    }

                  </View>}
                        </View>
                        <View className='flex flex-row'>
                            {item.country &&
                                <View className='flex-row items-center'>
                                    <FontAwesome name="location-arrow" size={14} color="white" />
                                    <Text className='text-white text-lg ml-1' style={styles.shadow}>{item.country?.name}</Text>
                                </View>
                            }
                            <Text className='ml-1 text-lg text-white mr-2'>
                                <TimeAgo timestamp={item.created_at}></TimeAgo>
                            </Text>
                        </View>
                    </View>
                    <View className='flex-row items-center mt-2 mb-2 grow'>
                        <View className='bg-accent/70 rounded-full py-2 grow mr-1'>
                            <PressableTip onPress={() => Linking.openURL("https://www.3seconds.me/" + item.profile.username)} />
                        </View>
                        {item['3sec_tips'].length > 0 && <View className='bg-base-100/70 rounded-full py-2 grow mr-1 justify-center items-center flex-row'>
                            <MaterialCommunityIcons name="hand-heart-outline" size={18} color={colorScheme == 'dark' ? 'black' : 'black'} />
                            <Text className='text-base font-medium ml-1'>{item['3sec_tips'].reduce((sum:any, tip:any) => sum + tip.amount, 0).toFixed(3)} ETH</Text>
                        </View>}
                    </View>
                    <View className='flex-row items-center mb-5 grow justify-between gap-1'>
                        <TouchableOpacity className={`flex-row justify-center items-center rounded-full py-2 bg-secondary/70 grow`}>
                            <View className='px-2 py-1'><FontAwesome name="eye" size={18} color="white" /></View>
                            <Text className='text-base font-medium mr-2 text-white'><FormatNumber number={item["3sec_views"][0].view_count} /></Text>
                        </TouchableOpacity>
                        <View className='bg-secondary/70 rounded-full px-4 py-2 grow mr-0'>
                            <PressableFire liked={{ liked: item.liked, temporaryLiked: temporaryLiked }} amount={likeCount} onPress={handleLikePress} />
                        </View>
                        <View className='bg-secondary/70 rounded-full px-4 py-2 grow mr-1'>
                            <PressableComment amount={commentCount} onPress={handleCommentPress} />
                        </View>
                    </View>
                </LinearGradient>
            </Pressable>
            {/* FIRES MODAL */}
            {firesModalVisible && <FiresModal visible={firesModalVisible} data={{ id: item.id, thumbnail: item.thumbnail_url }} onClose={() => {
                setFiresModalVisible(false);
                if (video.current && !threePlayPaused && !paused) {
                    video.current.resume();
                }
            }} />}
            {/* COMMENT MODAL */}
            {commentModalVisible && <CommentsModal visible={commentModalVisible} data={{ id: item.id, thumbnail: item.thumbnail_url, creator: item.profile.id }} onClose={() => {
                if (video.current && !threePlayPaused && !paused) {
                    video.current.resume();
                }
                setCommentModalVisible(false)
            }} />}
            {/* THREE DOT MODAL */}
            {threeDotsModalVisible && <ThreeDotsModal visible={threeDotsModalVisible} report={true} block={false} data={{ content_id: item.id }} onClose={() => {
                if (video.current && !threePlayPaused && !paused) {
                    video.current.resume();
                }
                setThreeDotsModalVisible(false)
            }} />}
        </>
    );

}
export default memo(InfiniteScrollItem);

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
    shadow: {
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 1,
        elevation: 5, // For Android
    },
});