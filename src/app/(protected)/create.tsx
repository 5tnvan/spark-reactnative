import Colors from '@/src/constants/Colors';
import { useDailyPostLimit } from '@/src/hooks/useDailyPostLimit';
import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { CameraType, FlashMode } from 'expo-camera/build/legacy/Camera.types';
import { Link, Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PressableAnimated } from '@/src/components/pressables/PressableAnimated';
import { SetCountryModal } from '@/src/components/modals/SetCountryModal';
import { useIsFocused } from '@react-navigation/native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import axios from 'axios';
import RNFS from 'react-native-fs';
import BunnyAPI from '@/src/constants/BunnyAPI';
import { Buffer } from 'buffer';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/services/providers/AuthProvider';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import Video from 'react-native-video';
import { useAuthUser } from '@/src/services/providers/AuthUserProvider';
import { Image } from 'react-native-elements';
import 'react-native-gesture-handler';
import { Livepeer } from 'livepeer';
import * as tus from 'tus-js-client'

const livepeer = new Livepeer({
  apiKey: process.env.EXPO_PUBLIC_LIVEPEER_API_KEY,
});

const CameraScreen = () => {

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isFocused = useIsFocused();

  //CONSUME PROVIDERS
  const { user } = useAuth();
  const { profile } = useAuthUser();

  // FETCH DIRECTLY
  const { limit } = useDailyPostLimit();

  // STATES
  //cam permissions
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();

  //cam settings
  const [facingType, setFacingType] = useState(CameraType.back);

  //cam recording
  const cameraRef = useRef<CameraView>(null);
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [counter, setCounter] = useState(0);

  //compression
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDurationError, setIsDurationError] = useState(false);

  //vid res
  const [recordedVideo, setRecordedVideo] = useState<any>(null); //video taken from camera
  const [cameraRollVideo, setCameraRollVideo] = useState<string>(); //video taken from camera roll
  const [thumbnail, setThumbnail] = useState<string>();

  //country modal
  const [locationModalVisible, setLocationModalVisible] = useState(false); //location modal
  const [locationId, setLocationId] = useState<any>(null);
  const [locationName, setLocationName] = useState("Set location");

  //publishing
  const [isUploading, setIsUploading] = useState(false);

  async function requestPermission() {
    await requestCam();
    await requestMic();
  }

  function toggleCameraFacing() {
    setFacingType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  }

  const handlePickCamRollVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ // No permissions request is necessary for launching the image library
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      selectionLimit: 1,
      videoMaxDuration: 3,
      aspect: [9, 16],
      exif: true,
    });

    console.log(result);

    if (!result.canceled) {

      // Check duration
      if (result.assets[0].duration && (result.assets[0].duration > 3500 || result.assets[0].duration < 2500)) {
        setIsDurationError(true);
        return;
      }

      // Check aspect ratio
      let videoToProcess: string | null = result.assets[0].uri; // Initial video URI
      const aspectRatio = result.assets[0].width / result.assets[0].height;
      const expectedAspectRatio = 9 / 16;
      const tolerance = 0.01; // Allows for minor floating-point differences

      if (Math.abs(aspectRatio - expectedAspectRatio) > tolerance) {
        // Video is not 9:16, crop it
        const cropVideoUri = await cropVideo(result.assets[0].uri); // Crop the video
        if (cropVideoUri != null) {
          console.log("Video cropped to 9:16");
          videoToProcess = cropVideoUri;
        }
      } else {
        console.log("Video is already 9:16");
      }

      // Generate thumbnail from cropped or original video
      const thumb = await generateThumbnail(videoToProcess); // Generate thumbnail
      console.log("Thumbnail generated:", thumb);

      if (thumb) {
        const compThumb = await compressThumbnail(thumb); // Compress thumbnail
        console.log("Compressed thumbnail:", compThumb);

        if (compThumb != null) setThumbnail(compThumb); // Set compressed thumbnail
      }

      // Compress video after thumbnail generation
      if (videoToProcess) {
        const compressVidUri = await compressVideo(videoToProcess); // Compress video
        if (compressVidUri != null) {
          setCameraRollVideo(compressVidUri); // Set compressed video
        }
      }
    }
  };


  const handleStartRecording = async () => {
    if (!isRecording) {

      if (!cameraRef.current) return;

      setIsRecording(true);

      const res = await cameraRef.current.recordAsync({
        maxDuration: 3,
        mirror: false,
      });

      if (res) {
        console.log("video recording res", res)
        setIsRecording(false);

        const thumb = await generateThumbnail(res.uri); //generate thumb
        console.log("thumb", thumb)

        if (thumb) {
          const compThumb = await compressThumbnail(thumb) //compress thumb
          console.log("compThumb", compThumb)

          if (compThumb != null) setThumbnail(compThumb) // set thum
        }

        const compressVidUri = await compressVideo(res.uri)
        if (compressVidUri != null) setRecordedVideo(compressVidUri); //compress video
      }

    }
  };

  //TIMER THAT COUNTS TO 3 SECS
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

  const handleCountrySelect = (countryId: string, countryName: string) => {
    console.log("countryId", countryId);
    setLocationId(countryId);
    setLocationName(countryName);
    //setModalVisible(false);
  };

  const generateThumbnail = async (videoUri: any) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        videoUri,
        { time: 1500 },
      );
      return uri;
    } catch (e) {
      console.warn(e);
      return null;
    }
  };

  const compressThumbnail = async (thumbUri: any) => {
    setIsCompressing(true);

    const timestamp = Date.now();
    const compressedThumbnailPath = `${FileSystem.cacheDirectory}comp_thumb_${timestamp}.jpg`;

    try {
      // Execute FFmpeg command
      const session = await FFmpegKit.execute(`-i "${thumbUri}" -vf "scale=iw*0.75:ih*0.75" -qscale:v 2 "${compressedThumbnailPath}"`);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        console.log("Thumbnail compression success", compressedThumbnailPath);
        return compressedThumbnailPath;
      } else if (ReturnCode.isCancel(returnCode)) {
        console.log("Thumbnail compression canceled");
        return null;
      } else {
        console.log("Thumbnail compression error");
        return null;
      }
    } catch (error) {
      console.error("FFmpeg execution error:", error);
      return null;
    } finally {
      setIsCompressing(false);
    }
  };

  const cropVideo = async (videoUri: string) => {
    const timestamp = Date.now();
    const croppedVideoPath = `${FileSystem.cacheDirectory}cropped_video_${timestamp}.mp4`;
  
    try {
      // FFmpeg command to crop video to 9:16 aspect ratio
      const session = await FFmpegKit.execute(
        `-i "${videoUri}" -vf "crop=in_h*9/16:in_h" "${croppedVideoPath}"`
      );
      const returnCode = await session.getReturnCode();
  
      if (ReturnCode.isSuccess(returnCode)) {
        console.log("Video cropped successfully", croppedVideoPath);
        return croppedVideoPath;
      } else if (ReturnCode.isCancel(returnCode)) {
        console.log("Cropping canceled");
        return null;
      } else {
        console.log("Cropping error");
        return null;
      }
    } catch (error) {
      console.error("FFmpeg execution error during cropping:", error);
      return null;
    }
  };

  const compressVideo = async (videoUri: string) => {

    setIsCompressing(true);

    const timestamp = Date.now();
    const compressedVideoPath = `${FileSystem.cacheDirectory}comp_video_${timestamp}.mp4`;

    try {

      // Execute FFmpeg command
      const session = await FFmpegKit.execute(`-i "${videoUri}" -c:v h264 -b:v 8000k -c:a aac -b:a 128k -ac 2 -filter:a loudnorm "${compressedVideoPath}"`);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        console.log("Compression success", compressedVideoPath);
        return compressedVideoPath;
      } else if (ReturnCode.isCancel(returnCode)) {
        console.log("Compression canceled");
        return null;
      } else {
        console.log("Compression error");
        return null;
      }
    } catch (error) {
      console.error("FFmpeg execution error:", error);
      return null;
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePublishing = async () => {

    console.log("publishing");

    if (limit) {
      alert("You've reached your 24hrs posting limit. Try again later.")
      return;
    }

    setIsUploading(true);
    const now = new Date().getTime();

    // Determine the video URI
    const videoUri = cameraRollVideo || recordedVideo;
    if (!videoUri) {
      console.warn("No video found.");
      setIsUploading(false);
      return;
    }

    // Ensure thumbnail is available
    if (!thumbnail) {
      console.warn("No thumbnail found.");
      setIsUploading(false);
      return;
    }

    //THUMBNAIL
    // Convert base64 encoded string to binary data
    const thumbBase64 = await RNFS.readFile(thumbnail, 'base64');
    const thumbBinaryData = Buffer.from(thumbBase64, 'base64');
    const thumbBunnyUrl = `https://${BunnyAPI.HOSTNAME}/${BunnyAPI.STORAGE_ZONE_NAME}/${user?.id}/${now}.jpg`;
    const pullZoneThumbUrl = `https://wildfire.b-cdn.net/${user?.id}/${now}.jpg`

    // Define thumbOptions
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

    // Upload thumbOptions to BUNNY.NET
    try {
      await axios(thumbOptions);
    } catch (error) {
      console.error('Thumbnail upload to BUNNY.NET error:', error);
      setIsUploading(false);
      return;
    }

    //THUMBNAIL
    // Convert base64 encoded string to binary data
    const videoBase64 = await RNFS.readFile(videoUri, 'base64');
    const videoBinaryData = Buffer.from(videoBase64, 'base64');
    const bunnyVideoUrl = `https://${BunnyAPI.HOSTNAME}/${BunnyAPI.STORAGE_ZONE_NAME}/${user?.id}/${now}.mp4`;
    const pullZoneVideoUrl = `https://wildfire.b-cdn.net/${user?.id}/${now}.mp4`

    // Define vidOptions
    const vidOptions = {
      method: 'PUT',
      url: bunnyVideoUrl,
      headers: {
        AccessKey: BunnyAPI.ACCESS_KEY,
        'Content-Type': 'video/mp4',
      },
      data: videoBinaryData, // Use binary data
      responseType: 'arraybuffer' as const, // Ensure the response is handled correctly and the type is compatible
    };

    // Upload vidOptions to BUNNY.NET
    try {
      await axios(vidOptions);
    } catch (error) {
      console.error('Video upload to BUNNY.NET error:', error);
      return;
    }

    // INSERT to SUPABASE
    try {
      const { data, error } = await supabase.from("3sec").insert({
        user_id: user?.id,
        video_url: pullZoneVideoUrl,
        thumbnail_url: pullZoneThumbUrl,
        country_id: locationId,
      })
        .select();

      if (Array.isArray(data) && data.length > 0) {
        console.log("data", data);
        console.log("VIDEO AND THUMBNAIL PUBLISHED SUCCESS!");
        // Fetch the video file and convert to Blob
        const videoBlob = await fetch(videoUri).then((res) => res.blob());
        // upload to livepeer
        const assetData = { name: videoUri };

        livepeer
          .asset.create(assetData)
          .then(async (response) => {
            console.log("Asset upload request:", response);
            const upload = new tus.Upload(videoBlob, {
              endpoint: response.data?.tusEndpoint,
              retryDelays: [0, 3000, 5000, 10000, 20000],
              metadata: {
                filename: `${profile.id}_${videoUri.name}`,
                filetype: videoBlob.type,
              },
              onError: error => {
                console.error("Failed because: " + error);
              },
              onProgress: (bytesUploaded, bytesTotal) => {
              },
              onSuccess: async () => {
                console.log("Download %s from %s", videoUri.name, upload.url);
                if (upload.url != null) {
                  // Insert record into '3sec' table
                  setRecordedVideo(undefined);
                  setCameraRollVideo(undefined);
                  setThumbnail(undefined)
                  const { error } = await supabase.from("3sec").upsert({
                    id: data[0].id,
                    user_id: user?.id,
                    playback_id: response?.data?.asset.playbackId,
                  })
                  if (!error) {
                    setIsUploading(false);
                    router.push("/(profile)/" + profile.username);
                  } else {
                    console.log("error", error);
                  }
                }
              },
            });
            upload.start();
          })
          .catch((error) => {
            console.error("Error requesting asset upload:", error);
          });

      } else {
        console.log(error);
      }
    } catch (error) {
      console.error('Upload to 3sec error:', error);
    } finally {
      //setIsUploading(false);
    }
  };

  // Reset
  useEffect(() => {
    if (isFocused) {
      setIsActive(true);
    } else {
      setIsDurationError(false);
      setCameraRollVideo(undefined);
      setRecordedVideo(undefined);
      setThumbnail(undefined);
      setLocationId(null)
      setLocationName('Set location');
      setIsActive(false);
    }
  }, [isFocused]);

  //CAM MIC PERMISSIONS
  if (!camPerm && !micPerm) {
    return <View><Text>Loading...</Text></View>;
  }

  if (!camPerm?.granted && !micPerm?.granted) {
    return (
      <View className='flex-1 justify-center items-center px-10'>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>We need your permission to show the camera</Text>
        <PressableAnimated className='bg-accent' onPress={requestPermission}><Text>Grant permissions</Text></PressableAnimated>
      </View>
    );
  }

  return (
    <View className='flex-1'>
      {/* HEADER */}
      <Stack.Screen options={{
        headerShown: true, title: "Create", headerRight: () => (
          <Link href="/modals/tool-tip-create" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="info-circle"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
      }} />
      {/* CAMERA */}
      <CameraView
        mode='video'
        ref={cameraRef}
        style={styles.camera}
        facing={facingType}
      >
      </CameraView>

      {/* RECORDING MODE */}

      {isRecording &&
        <SafeAreaView className='absolute top-3 self-center'>
          <View className='flex-row justify-start items-center p-3 rounded-full bg-zinc-700/40 w-24'>
            <FontAwesome name="circle" size={16} color="red" />
            <Text className='ml-1 text-white font-semibold'>{formatCounter(counter)}s</Text>
          </View>
        </SafeAreaView>}

      {!recordedVideo && !cameraRollVideo && !isCompressing && !isDurationError && (
        <>
          {/* RIGHT CONTROLS */}
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
              onPress={toggleCameraFacing}
            />
          </View>

          {/* CAM ROLL CONTROLS */}
          <PressableAnimated className='absolute bottom-10 left-10 w-14 h-16 bg-black/30 rounded-2xl justify-center items-center border border-zinc-400' onPress={handlePickCamRollVideo}>
            <Feather name="film" size={24} color="#CBCBCB" />
          </PressableAnimated>

          <Pressable
            onPress={handleStartRecording}
            onLongPress={handleStartRecording}
            className={`absolute bottom-10 self-center  rounded-full flex-1 justify-center items-center ${isRecording ? 'bg-red-500 w-24 h-24' : 'bg-white w-20 h-20'
              }`}
          >
            <View className='w-16 h-16 rounded-full bg-red-500' />
          </Pressable>
        </>
      )}

      {/* DURATION ERROR */}
      {isDurationError && (
        <View className='absolute flex-1 w-full h-full bg-black justify-center'>
          <Text className='text-white self-center mb-2'>Your video needs to be 3 secs</Text>
          <TouchableOpacity onPress={() => setIsDurationError(false)}><Text className='text-accent self-center'>{`<`} Go back</Text></TouchableOpacity>
        </View>
      )}

      {/* COMPRESSION */}
      {isCompressing && (
        <View className='absolute flex-1 w-full h-full bg-black justify-center'>
          <Text className='text-white self-center mb-2'>Creating your video...</Text>
          <ActivityIndicator />
        </View>
      )}

      {/* CAM ROLL VIDEO RESULT */}
      {cameraRollVideo && (
        <>
          <View className=''>
            <Video
              className='w-full h-full'
              source={{
                uri: cameraRollVideo,
              }}
              repeat
            />
            <View className='absolute top-2 left-2 p-1 rounded-full bg-white/50 justify-center'>
              <Ionicons
                onPress={() => setCameraRollVideo(undefined)}
                name="chevron-back"
                size={28}
                color="black"
              />
            </View>

            {/* {thumbnail &&
              <View className='absolute top-2 right-2 rounded-full'>
                <Image
                  source={{ uri: thumbnail }}
                  style={{ width: 90, height: 160, resizeMode: 'cover' }}
                  className='rounded-full bg-black/10'
                />
              </View>
            } */}

            <View className='absolute bottom-3 flex-row w-full items-center px-3'>
              <Pressable className='flex-row justify-between grow py-3 px-3 items-center rounded-full bg-white mt-3 mr-3' onPress={() => setLocationModalVisible(true)}>
                <View><FontAwesome name="location-arrow" size={14} color="black" /></View>
                <Text className='text-base font-semibold'>{locationName}</Text>
                <View></View>
              </Pressable>
              <TouchableOpacity className={`flex-row justify-between grow py-3 px-2 items-center rounded-full ${limit ? 'bg-primary' : 'bg-accent'}  mt-3`} onPress={handlePublishing}>
                <View className='w-2'></View>
                <Text className='text-base font-semibold'>Publish</Text>
                {isUploading ? <ActivityIndicator size="small" color="#0000ff" className='' /> :
                  <Ionicons name="chevron-forward" size={15} color="black" />}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* RECORDED VIDEO RESULT */}
      {recordedVideo && (
        <>
          <View className='bg-black'>
            <Video
              className='w-full h-full'
              source={{
                uri: recordedVideo,
              }}
              repeat
            />
            <View className='absolute top-2 left-2 p-1 rounded-full bg-white/50 self-center'>
              <Ionicons
                onPress={() => setRecordedVideo(undefined)}
                name="chevron-back"
                size={28}
                color="black"
              />
            </View>

            {/* {thumbnail &&
              <View className='absolute top-2 right-2 rounded-full'>
                <Image
                  source={{ uri: thumbnail }}
                  style={{ width: 90, height: 160, resizeMode: 'cover' }}
                  className='rounded-full bg-black/10'
                />
              </View>
            } */}

            <View className='absolute bottom-3 flex-row w-full items-center px-3'>
              <Pressable className='flex-row justify-between grow py-3 px-3 items-center rounded-full bg-white mt-3 mr-3' onPress={() => setLocationModalVisible(true)}>
                <View><FontAwesome name="location-arrow" size={14} color="black" /></View>
                <Text className='text-base font-semibold'>{locationName}</Text>
                <View></View>
              </Pressable>
              <TouchableOpacity className={`flex-row justify-between grow py-3 px-2 items-center rounded-full ${limit ? 'bg-primary' : 'bg-accent'} mt-3`} onPress={handlePublishing}>
                <View className='w-2'></View>
                <Text className='text-base font-semibold'>Publish</Text>
                {isUploading ? <ActivityIndicator size="small" color="#0000ff" className='' /> :
                  <Ionicons name="chevron-forward" size={15} color="black" />}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* LOCATION MODAL */}
      {locationModalVisible && <SetCountryModal visible={locationModalVisible} onClose={() => setLocationModalVisible(false)} passBack={handleCountrySelect} />}


    </View>
  );
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default CameraScreen;