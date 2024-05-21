import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Button,
  ActivityIndicator,
} from 'react-native';
import {
  useCameraPermission,
  useMicrophonePermission,
  useCameraDevice,
  Camera,
  PhotoFile,
  TakePhotoOptions,
  VideoFile,
} from 'react-native-vision-camera';
import { useFocusEffect } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/services/providers/AuthProvider';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { getPublicURL } from '@/src/utils/getPublicUrl';
import axios from 'axios';
import RNFS from 'react-native-fs';
import BunnyAPI from '@/src/constants/BunnyAPI';
import { Buffer } from 'buffer';
import * as VideoThumbnails from 'expo-video-thumbnails';

const CameraScreen = () => {

  const router = useRouter();
  const { user } = useAuth();

  /**
   * Cam & mic permissions
   * **/
  const { hasPermission: hasCam, requestPermission: requestCam } = useCameraPermission();
  const { hasPermission: hasMic, requestPermission: requestMic } = useMicrophonePermission();

  useEffect(() => {
    if (!hasCam) requestCam();
    if (!hasMic) requestMic();
  }, [hasCam, hasMic]);

  /**
   * Camera settings
   * **/
  const [position, setPosition] = useState<'front' | 'back'>('back');
  const device = useCameraDevice(position);
  const camera = useRef<Camera>(null);
  const [flash, setFlash] = useState<TakePhotoOptions['flash']>('off');
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => {
        setIsActive(false);
      };
    }, [])
  );

  /**
   * Video results
   * **/
  const [video, setVideo] = useState<VideoFile>();

  /**
   * Timer, counts from to 15 secs
   * **/
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrameId: number | undefined;
  
    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      setCounter(elapsedTime);
      animationFrameId = requestAnimationFrame(animate);
    };
  
    if (isRecording) {
      startTime = Date.now();
      animationFrameId = requestAnimationFrame(animate);
    } else {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      setCounter(0);
    }
  
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRecording]);
  

  const formatCounter = (counter: number) => {
    const seconds = Math.floor(counter / 1000);
    const milliseconds = Math.floor(counter % 1000);
    return `${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
  };
  

  /**
   * Handle recording
   * **/
  const onStartRecording = async () => {
    if (!camera.current) return;
    setIsRecording(true);

    camera.current.startRecording({
      flash: flash === 'on' ? 'on' : 'off',
      videoBitRate: 'high',
      onRecordingFinished: async (video) => {
        console.log("on recording finish", video);
        setIsRecording(false);
        setVideo(video);
      },
      onRecordingError: (error) => {
        console.error(error);
        setIsRecording(false);
      }
    })
    setTimeout(() => {
      console.log("im here");
      camera.current?.stopRecording()
    }, 3000)
  };

  // const onStopRecording = async () => {
  //   if (!camera.current) return;
  //   console.log("im there");

  //   camera.current?.stopRecording();
  // };
  
  
  /**
   * Handle upload
   **/
  const generateThumbnail = async (video_url: any) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        video_url,
        { time: 15000 }
      );
      return uri;
    } catch (e) {
      console.warn(e);
      return null;
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  
  const uploadVideo = async () => {
    setIsUploading(true);
    const now = new Date().getTime();

    // Set up video URI
    let videoUri = '';
    if (cameraRollVideo) videoUri = cameraRollVideo;
    else if (video) videoUri = video.path;

     // Generate thumbnail
    const thumbUri = await generateThumbnail(videoUri);
    if (!thumbUri) return;

    // Read the thumbnail file as binary
    let thumbBinary = await RNFS.readFile(thumbUri, 'base64');

    // Convert base64 encoded string to binary data
    const thumbBinaryData = Buffer.from(thumbBinary, 'base64');
    const thumbBunnyUrl = `https://${BunnyAPI.HOSTNAME}/${BunnyAPI.STORAGE_ZONE_NAME}/${user?.id}/${now}.jpg`;
    const pullZoneThumbUrl = `https://wildfire.b-cdn.net/${user?.id}/${now}.jpg`

    // Define the upload options for the thumbnail
    const thumbOptions = {
      method: 'PUT',
      url: thumbBunnyUrl,
      headers: {
        AccessKey: BunnyAPI.ACCESS_KEY,
        'Content-Type': 'image/jpeg',
      },
      data: thumbBinaryData,
      responseType: 'arraybuffer' as const,
    };

    // Perform the thumbnail upload
    try {
      await axios(thumbOptions);
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      return;
    }
  
    // Read the video file as binary
    let videoBinary = await RNFS.readFile(videoUri, 'base64');
  
    // Convert base64 encoded string to binary data
    const videoBinaryData = Buffer.from(videoBinary, 'base64');
    const bunnyVideoUrl = `https://${BunnyAPI.HOSTNAME}/${BunnyAPI.STORAGE_ZONE_NAME}/${user?.id}/${now}.mp4`;
    const pullZoneVideoUrl = `https://wildfire.b-cdn.net/${user?.id}/${now}.mp4`
    
    // Define the upload options
    const options = {
      method: 'PUT',
      url: bunnyVideoUrl,
      headers: {
        AccessKey: BunnyAPI.ACCESS_KEY,
        'Content-Type': 'video/mp4',
      },
      data: videoBinaryData, // Use binary data
      responseType: 'arraybuffer' as const, // Ensure the response is handled correctly and the type is compatible
    };
  
    // Perform the upload
    
    try {
      const response = await axios(options);
      console.log('Upload response:', response.data);
      const { error } = await supabase.from("1sec").insert({ 
        user_id: user?.id, 
        video_url: pullZoneVideoUrl,
        thumbnail_url: pullZoneThumbUrl,
      });
      if(!error) {
        console.log("uploaded!!");
        setVideo(undefined);
        setCameraRollVideo(undefined);
        router.push("/(protected)/profile");
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Error settings
   * **/
  if (!hasCam || !hasMic) return <SafeAreaView><Text>You need to grant camera or microphone access.</Text></SafeAreaView>;
  if (!device) return <SafeAreaView><Text>Camera device not found</Text></SafeAreaView>;

  /**
   * Video picker
   * **/
  const [cameraRollVideo, setCameraRollVideo] = useState<string>();

  const pickVideo = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
      selectionLimit: 1,
      videoMaxDuration: 3,
      exif: true,
    });

    console.log(result);

    if (!result.canceled) {
      setCameraRollVideo(result.assets[0].uri);
    }
  };


  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: true }} />

      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && !video}
        video
        audio
      />

      {isRecording && <SafeAreaView className='absolute self-center'><Text className='bg-gray-700 text-white p-3'>{formatCounter(counter)}s</Text></SafeAreaView>}


      {video && (
        <>
          <View className='bg-black'>
            <Video
              className='w-full h-full'
              source={{
                uri: video.path,
              }}
              useNativeControls={false}
              isLooping
              shouldPlay
            />
            <Ionicons
              onPress={() => setVideo(undefined)}
              name="chevron-back"
              size={28}
              color="white"
              style={{ position: 'absolute', top: 20, left: 10 }}
            />
            <Pressable className='absolute flex-row bottom-6 right-4 items-center justify-center p-4 rounded-full bg-accent' onPress={uploadVideo}>
              <Text className='text-base font-semibold'>Publish</Text>
              {isUploading && <ActivityIndicator size="small" color="#0000ff" className='ml-1' />}
            </Pressable>
          </View>

        </>
      )}

      {cameraRollVideo && (
        <>
          <View className='bg-black'>
            <Video
              className='w-full h-full'
              source={{
                uri: cameraRollVideo,
              }}
              useNativeControls={false}
              isLooping
              shouldPlay
            />
            <Ionicons
              onPress={() => setCameraRollVideo(undefined)}
              name="chevron-back"
              size={28}
              color="white"
              style={{ position: 'absolute', top: 20, left: 10 }}
            />
            <Pressable className='absolute flex-row bottom-6 right-4 items-center justify-center p-4 rounded-full bg-accent' onPress={uploadVideo}>
              <Text className='text-base font-semibold'>Publish</Text>
              {isUploading && <ActivityIndicator size="small" color="#0000ff" className='ml-1'/>}
            </Pressable>
          </View>
        </>
      )}

      {!video && !cameraRollVideo && (
        <>
          <View
            style={{
              position: 'absolute',
              right: 10,
              top: 20,
              padding: 10,
              borderRadius: 5,
              backgroundColor: 'rgba(0, 0, 0, 0.40)',
              gap: 30,
            }}
          >
            <MaterialIcons
              name="flip-camera-android"
              size={30}
              color="white"
              onPress={() => {
                if (position === 'back') setFlash('off');
                setPosition(prev => (prev === 'back' ? 'front' : 'back'));
                
              }}
            />
            <Ionicons
              name={flash === 'off' ? 'flash-off' : 'flash'}
              onPress={() => {
                if (position === 'back') {
                  setFlash((curValue) => (curValue === 'off' ? 'on' : 'off'));
                }
              }}
              size={30}
              color="white"
            />

          </View>

          <Pressable className='absolute bottom-10 left-10' onPress={pickVideo}>
            <View style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)'}} className='w-14 h-16 bg-black rounded-2xl justify-center items-center border border-zinc-400'>
              <Feather name="film" size={24} color="#CBCBCB" />
            </View>
          </Pressable>

          <Pressable
            onLongPress={onStartRecording}
            className={`absolute bottom-10 self-center  rounded-full flex-1 justify-center items-center ${
              isRecording ? 'bg-red-500 w-24 h-24' : 'bg-white w-20 h-20'
            }`}
          >
            <View className='w-16 h-16 rounded-full bg-red-500'/>
          </Pressable>
        </>
      )}
    </View>
  );
};

export default CameraScreen;