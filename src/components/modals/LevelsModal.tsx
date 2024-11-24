import { Modal, Pressable, ScrollView, TouchableOpacity, useColorScheme, Image, ImageBackground } from 'react-native';
import { Text, View } from "@/src/components/Themed";
import { Input } from 'react-native-elements';
import { useEffect, useState } from 'react';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { fetchProfileMatchingWith } from '@/src/utils/fetch/fetchProfile';
import { Avatar } from '../avatars/avatar';
import { useRouter } from 'expo-router';
import { useAuthUser } from '@/src/services/providers/AuthUserProvider';

export function LevelsModal({ visible, onClose }: any) {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const handleReset = () => {
        onClose();
    }

    const { profile } = useAuthUser();

    const [level1, setLevel1] = useState<any>(null);
    const [level2, setLevel2] = useState<any>(null);
    const [level3, setLevel3] = useState<any>(null);
    const [level4, setLevel4] = useState<any>(null);
    const [level5, setLevel5] = useState<any>(null);

    useEffect(() => {
        const fetch = async () => {
            setLevel1(profile?.levels.find((item: any) => item.level === 1));
            setLevel2(profile?.levels.find((item: any) => item.level === 2));
            setLevel3(profile?.levels.find((item: any) => item.level === 3));
            setLevel4(profile?.levels.find((item: any) => item.level === 4));
            setLevel5(profile?.levels.find((item: any) => item.level === 5));
        };
        fetch();
    }, [profile?.levels]);


    return (
        <Modal
            animationType="slide"
            presentationStyle="formSheet"
            visible={visible}
            onRequestClose={handleReset}
        >
            <View className="flex-1">
                {/* HEADER */}
                <View className={`flex-row justify-between items-center px-2 py-4`}>
                    <Ionicons
                        onPress={handleReset}
                        name="chevron-back"
                        size={22}
                        color={colorScheme == 'dark' ? 'white' : 'black'}
                    />
                    <Text className='text-lg font-medium self-center'>Levels</Text>
                    <Text className='text-lg font-medium self-center'>{`     `} </Text>
                </View>
                {/* SCROLL VIEW */}
                <ScrollView className='flex-1 px-3'>
                    {/* NOOB */}
                    <View className='mb-4'>
                        <View className='flex-row justify-between mb-3'>
                            <Text className='text-base'>Ground Level</Text>
                            <Text className='text-base font-medium text-accent'>Ember</Text>
                        </View>
                        <View className='bg-accent rounded-xl'>
                            <Image
                                source={require("../../../assets/images/levels/ember.jpg")}
                                className='rounded-xl'
                                style={{ width: '100%', height: 400, opacity: 0.7 }}
                            />
                        </View>
                    </View>

                    {/* LEVEL 1 */}
                    {level1 ?
                        <View className='mb-4'>
                            <View className='flex-row justify-between mb-3'>
                                <Text className='text-base'>Level 1</Text>
                                <Text className='text-base font-medium text-accent'>Glow</Text>
                            </View>
                            <View className='bg-accent rounded-xl'>
                                <Image
                                    source={require("../../../assets/images/levels/glow.jpg")}
                                    className='rounded-xl'
                                    style={{ width: '100%', height: 400, opacity: 0.7 }}
                                />
                            </View>
                        </View>
                        :
                        <View className='mb-4'>
                            <View className='bg-zinc-300 rounded-lg' style={{ height: 200 }}>
                                <View className='self-center m-auto bg-zinc-400 p-3 rounded-full font-medium text-xl'><Text className='text-base'>Locked</Text></View>
                            </View>
                        </View>
                    }


                    {/* LEVEL 2 */}
                    {level2 ?
                        <View className='mb-4'>
                            <View className='flex-row justify-between mb-3'>
                                <Text className='text-base'>Level 2</Text>
                                <Text className='text-base font-medium text-accent'>Flame</Text>
                            </View>
                            <View className='bg-accent rounded-xl'>
                                <Image
                                    source={require("../../../assets/images/levels/level2.png")}
                                    className='rounded-xl'
                                    style={{ width: '100%', height: 400, opacity: 0.7 }}
                                />
                            </View>
                        </View>
                        :
                        <View className='mb-4'>
                            <View className='bg-zinc-300 rounded-lg' style={{ height: 200 }}>
                                <View className='self-center m-auto bg-zinc-400 p-3 rounded-full font-medium text-xl'><Text className='text-base'>Locked</Text></View>
                            </View>
                        </View>
                    }


                    {/* LEVEL 3 */}
                    {level3 ?
                        <View className='mb-4'>
                            <View className='flex-row justify-between mb-3'>
                                <Text className='text-base'>Level 3</Text>
                                <Text className='text-base font-medium text-accent'>Blaze</Text>
                            </View>
                            <View className='bg-accent rounded-xl'>
                                <Image
                                    source={require("../../../assets/images/levels/level3.png")}
                                    className='rounded-xl'
                                    style={{ width: '100%', height: 400, opacity: 0.7 }}
                                />
                            </View>
                        </View>
                        :
                        <View className='mb-4'>
                            <View className='bg-zinc-300 rounded-lg' style={{ height: 200 }}>
                                <View className='self-center m-auto bg-zinc-400 p-3 rounded-full font-medium text-xl'><Text className='text-base'>Locked</Text></View>
                            </View>
                        </View>
                    }


                    {/* LEVEL 4 */}
                    {level3 ?
                        <View className='mb-4'>
                            <View className='flex-row justify-between mb-3'>
                                <Text className='text-base'>Level 4</Text>
                                <Text className='text-base font-medium text-accent'>Inferno</Text>
                            </View>
                            <View className='bg-accent rounded-xl'>
                                <Image
                                    source={require("../../../assets/images/levels/level4.png")}
                                    className='rounded-xl'
                                    style={{ width: '100%', height: 400, opacity: 0.7 }}
                                />
                            </View>
                        </View>
                        :
                        <View className='mb-4'>
                            <View className='bg-zinc-300 rounded-lg' style={{ height: 200 }}>
                                <View className='self-center m-auto bg-zinc-400 p-3 rounded-full font-medium text-xl'><Text className='text-base'>Locked</Text></View>
                            </View>
                        </View>
                    }


                    {/* LEVEL 5 */}
                    {level3 ?
                        <View className='mb-4'>
                            <View className='flex-row justify-between mb-3'>
                                <Text className='text-base'>Level 5</Text>
                                <Text className='text-base font-medium text-accent'>Starfire</Text>
                            </View>
                            <View className='bg-accent rounded-xl'>
                                <Image
                                    source={require("../../../assets/images/levels/level5.png")}
                                    className='rounded-xl'
                                    style={{ width: '100%', height: 400, opacity: 0.7 }}
                                />
                            </View>
                        </View>
                        :
                        <View className='mb-4'>
                            <View className='bg-zinc-300 rounded-lg' style={{ height: 200 }}>
                                <View className='self-center m-auto bg-zinc-400 p-3 rounded-full font-medium text-xl'><Text className='text-base'>Locked</Text></View>
                            </View>
                        </View>
                    }

                </ScrollView>
            </View>
        </Modal>
    );
}
