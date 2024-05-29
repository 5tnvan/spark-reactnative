import { Image, StyleSheet, useColorScheme, TouchableOpacity, Pressable, Animated } from "react-native";
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from "../Themed";
import { SimpleLineIcons, MaterialCommunityIcons, Entypo, FontAwesome } from "@expo/vector-icons";
import Video from "react-native-video";
import { TimeAgo } from "../TimeAgo";
import { Avatar } from "../avatars/avatar";
import { mute, unmute } from '../../utils/exportedFunction';
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/services/providers/AuthProvider";
import FormatNumber from "../FormatNumber";
import { FiresModal } from "../modals/FiresModal";
import { CommentsModal } from "../modals/CommentsModal";
import { useRouter } from "expo-router";
import { increment_views, insert_views, watched } from "@/src/utils/views/incrementViews";
import { fetchViewCount } from "@/src/utils/fetch/fetchViewCount";
import { calculateTotalViews } from "@/src/utils/views/calculateTotalViews";
import { getTotalViews } from "@/src/utils/views/getTotalViews";

export default function PostItem({ item, isPlaying, isMuted, toggleMute }: any) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const videoRef = useRef<any>(null);

  //COSUME PROVIDERS
  const { user } = useAuth();

  //AFTER 3rd PLAY REPEAT, PAUSE VIDEO
  const [threePlayPaused, setThreePlayPaused] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0);

  //GET VIDEO VIEWS
  const [totalViews, setTotalViews] = useState<any>(null);
  const handleGetViews = async () => {
    const res = await getTotalViews(item.id);
    setTotalViews(res);
  }

  //HANDLE INCREMENT VIEWS
  const handleIncrementViews = async () => {
    const _watched = await watched(item.id, user?.id);
    if (_watched) {
      increment_views(item.id, user?.id)
    } else {
      const error = await insert_views(item.id, user?.id)
      if (!error) increment_views(item.id, user?.id)
    }
  }

  // HANDLE AFTER 3RD PLAY
  const handleThreePlayRepeat = () => {
    setRepeatCount(prevCount => {
      if (prevCount < 2) {
        return prevCount + 1;
      } else {
        // Pause the video after 3th repeat
        if (videoRef.current) {
          videoRef.current.seek(0);
          videoRef.current.pause();
          setThreePlayPaused(true);
          fadeIn();
        }
        return prevCount;
      }
    });
  };

  // HANDLE WATCH AGAIN
  const handleWatchAgain = async () => {
    // increment views by +1
    handleIncrementViews();
    //reset
    setRepeatCount(0); // Reset the repeat count
    setThreePlayPaused(false); // Set paused state to false to resume the video
    fadeAnim.setValue(0); // Reset the opacity animation value
    if (videoRef.current) videoRef.current.resume();
  };
  // WATCH AGAIN FADE-IN ANIM
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  };

  //WHEN VIDEO IS PLAYING
  useEffect(() => {
    if (isPlaying) {
      // increment views by +1
      handleIncrementViews();
      console.log("isPlaying 2");
      // reset
      setRepeatCount(0);
      setThreePlayPaused(false);
      fadeAnim.setValue(0); // Reset opacity to 0
    }
  }, [isPlaying]);

  //HANDLE LIKE PRESS
  const [likeCount, setLikeCount] = useState(item["3sec_fires"][0].count);
  const [temporaryLiked, setTemporaryLiked] = useState(false);
  const [firesModalVisible, setFiresModalVisible] = useState(false); //fires modal

  const handleLikePress = async () => {
    if (item.liked || temporaryLiked) { //if liked already, a modal will appear
      setFiresModalVisible(true); 
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
  };

  //PAUSE VIDEOS WHEN MODALS ARE OPEN
  useEffect(() => {
    if (firesModalVisible || commentModalVisible) {
      videoRef.current.pause();
    } else if ((!firesModalVisible || !commentModalVisible) && !threePlayPaused) {
      videoRef.current.resume();
    }
  }, [firesModalVisible, commentModalVisible]);

  return (
    <View className={`mb-1 rounded-2xl`}>
      {/* HEADER */}
      <View className="flex-row justify-between items-center p-4">
        <Pressable className="flex-row items-center" onPress={() => router.push("/(profile)/" + item.profile.username)}>
          <Text className="font-semibold text-base">@{item.profile.username}</Text>
          <Text className="ml-1 text-base"><TimeAgo timestamp={item.created_at}></TimeAgo></Text>
        </Pressable>
        <View>
          {item.country &&
            <View className={`${colorScheme == 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'} flex-row items-center py-1 px-3 rounded-full`}>
              <FontAwesome name="location-arrow" size={14} color={colorScheme == 'dark' ? 'white' : 'black'} />
              <Text className='text-base ml-1'>{item.country.name}</Text>
            </View>
          }
        </View>
      </View>

      {/* VIDEO */}
      <View className="w-full h-[500px] relative">
        <Video
          ref={videoRef}
          source={{ uri: item.video_url }}
          resizeMode="cover"
          style={styles.video}
          repeat={true}
          volume={isMuted ? 0 : 1}
          paused={!isPlaying}
          onEnd={handleThreePlayRepeat}
        />

        {/* AVATAR */}
        <TouchableOpacity className="absolute p-3" onPress={() => router.push("/(profile)/" + item.profile.username)}>
          <Avatar
            avatar_url={item.profile.avatar_url}
            username={item.profile.username}
            size={"md"}
            ring={true}
          ></Avatar>
        </TouchableOpacity>

        {/* PAUSED */}
        {threePlayPaused && (
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Pressable className="bg-zinc-100/70 p-3 rounded-full flex-row" onPress={handleWatchAgain}>
              <FontAwesome name="eye" size={24} color="black" />
              <Text className="text-black text-base ml-1">Watch again</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* MUTE BUTTON */}
        <Pressable onPress={toggleMute} className="absolute bottom-0 left-0 p-4 ">
          <Image source={isMuted ? mute : unmute} className="w-6 h-6" />
        </Pressable>
      </View>

      {/* ACTIONS */}
      <View className="flex-row justify-between p-4">
        <TouchableOpacity className={`flex-row gap-1 items-center rounded-full px-2 ${colorScheme == 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`} onPress={() => handleGetViews()}>
          <FontAwesome name="eye" size={18} color={colorScheme == 'dark' ? 'white' : 'black'} />
          <Text className="text-base">{totalViews && <FormatNumber number={totalViews} />}</Text>
        </TouchableOpacity>
        <View className="flex-row gap-4 self-end">
          <Pressable onPress={handleLikePress} className="flex-row items-center">
            <SimpleLineIcons name="fire" size={26} color={item.liked || temporaryLiked ? "red" : `${colorScheme == 'dark' ? "white" : 'black'}`} />
            {likeCount > 0 && <Text className="ml-1 font-medium text-lg"><FormatNumber number={likeCount} /></Text>}
          </Pressable>
          <Pressable onPress={handleCommentPress} className="flex-row items-center">
            <MaterialCommunityIcons name="message-reply-text-outline" size={28} color={`${colorScheme == 'dark' ? "white" : '#333'}`} />
            {commentCount > 0 && <Text className="ml-1 font-medium text-lg"><FormatNumber number={commentCount} /></Text>}
          </Pressable>

          {/* <View>
          <Entypo name="slideshare" size={24} color={`${colorScheme == 'dark' ? "white" : 'black'}`} />
          <Text className="ml-1">124</Text>
        </View> */}
        </View>
      </View>


      {/* FIRES MODAL */}
      {firesModalVisible && <FiresModal visible={firesModalVisible} data={{ id: item.id, thumbnail: item.thumbnail_url }} onClose={() => setFiresModalVisible(false)} />}

      {/* FIRES MODAL */}
      {commentModalVisible && <CommentsModal visible={commentModalVisible} data={{ id: item.id, thumbnail: item.thumbnail_url }} onClose={() => setCommentModalVisible(false)} />}

    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Adjust the background color as needed
    justifyContent: 'center',
    alignItems: 'center',
  },
});

