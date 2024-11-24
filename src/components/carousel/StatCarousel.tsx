import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Dimensions, Pressable, Linking, useColorScheme } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Avatar } from '../avatars/avatar';
import { calculateSum } from '../../utils/calculateSum';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useAuthUser } from '@/src/services/providers/AuthUserProvider';
import { useIncomingTransactions } from '@/src/hooks/useIncomingTransactions';
import { useUserFeed } from '@/src/hooks/useUserFeed';
import { LevelsModal } from '../modals/LevelsModal';
import { convertEthToUsd } from '@/src/utils/convertEthToUsd';

const CARD_WIDTH = Dimensions.get('window').width * 0.6;
const CARD_HEIGHT = 145
const MARGIN_LEFT = 1;
const MARGIN_RIGHT = 7;

const cardData = [
    // { id: '1', title: 'Total Views', stat: 0, cta: 'Create', icon: 'eye', avatar: false },
    { id: '2', title: '', stat: '', cta: 'View all levels', avatar: true },
    { id: '3', title: 'Kinnect Wallet', stat: 0, cta: 'View Wallet', icon: 'coins' },
];

export default function StatCarousel() {
    const router = useRouter();
    const isFocused = useIsFocused(); // Get focused state
    const colorScheme = useColorScheme();
    
    
    //CONSUME PROVIDERS
    const { profile } = useAuthUser();

    //FETCH DIRECTLY
    const incomingRes = useIncomingTransactions(profile?.wallet_id);
    const { feed: userFeed, refetch: refetchUserFeed } = useUserFeed(profile?.id);

    //REFETCH PROVIDERS WHEN SCREEN IS IN FOCUS
    useEffect(() => {
        if (isFocused) refetchUserFeed();
    }, [isFocused]);

    
    //DYNAMICALLY GENERATE CARDS DATA
    // const sumOfViews = userFeed?.reduce((total: any, item: any) => total + item.views, 0);
    const highestLevel = profile?.levels.reduce((max: number, item: any) => item.level > max ? item.level : max, 0);
    const levelNames = ["Ember", "Glow", "Flame", "Blaze", "Inferno", "Starfire"];
    const levelName = levelNames[highestLevel] || "unknown";
    const sum = calculateSum(incomingRes.ethereumData) + calculateSum(incomingRes.baseData);
    const balance = sum === 0 ? sum.toFixed(2) : sum.toFixed(3);

    // cardData[0].stat = sumOfViews;
    cardData[0].title = 'Level ' + highestLevel;
    cardData[0].stat = levelName;
    cardData[1].stat = profile?.username;

    //HANDLE LEVELS MODAL
    const [levelsModalVisible, setLevelsModalVisible] = useState(false); //levels modal

    /**
     * HANDLE PRESS EVENT
     */
    const handleCta = (id: any) => {
        switch (id) {
            case '1':
                router.push("/create")
                break;
            case '2':
                setLevelsModalVisible(true);
                break;
            case '3':
                Linking.openURL('https://www.kinnectwallet.com/' + profile.username);
                break;
            default:
                console.log('Button pressed');
        }
    };


    return (
        <>
        <FlatList
            data={cardData}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <Item id={item.id} title={item.title} stat={item.stat} cta={item.cta} icon={item.icon} avatar={item.avatar} profile={profile} onPress={handleCta} colorScheme={colorScheme} />}
            snapToInterval={CARD_WIDTH + MARGIN_LEFT + MARGIN_RIGHT} // Calculate the size for a card including marginLeft and marginRight
            decelerationRate="fast" // Make the scrolling feel snappier
            contentContainerStyle={styles.container}
            snapToAlignment="start" // Snap to the start of the card
        />
        <LevelsModal visible={levelsModalVisible} onClose={() => setLevelsModalVisible(false)} />
        </>
        
    );
};

type Props = {
    id: any,
    title: any,
    stat: any,
    cta: any,
    icon: any,
    avatar: any,
    profile: any,
    onPress: any,
    colorScheme: any,
};

const Item = ({ id, title, stat, cta, icon, avatar, profile, onPress, colorScheme }: Props) => (
    <Pressable style={styles.card} className={`${colorScheme == 'dark' ? 'bg-zinc-900' : 'bg-white'} flex-row`} onPress={() => onPress(id)}>
        <View className=''>
            <Text className={`${colorScheme == 'dark' ? 'text-white' : 'text-black'} text-lg font-medium mb-1`}>{title}</Text>
            <Text className={`text-4xl font-bold ${colorScheme == 'dark' ? 'text-white' : 'text-black'} mb-2`}>{stat}</Text>
            <View className='bg-accent px-5 py-1 rounded-full'>
                <Text className='font-medium'>{cta}</Text>
            </View>
        </View>
        <View className='grow items-end'>
            {avatar &&
                <View>
                    <View className='absolute z-10 right-1 w-3 h-3 bg-green-400 rounded-full'></View>
                    <Avatar avatar_url={profile?.avatar_url} username={profile?.username} size={'md'} ring={true}></Avatar>
                </View>
            }
            <FontAwesome5 name={icon} size={30} color={colorScheme == 'dark' ? 'white' : 'black' } />
        </View>
    </Pressable>
);

const styles = StyleSheet.create({
    container: {
        height: CARD_HEIGHT
    },
    card: {
        borderRadius: 10,
        width: CARD_WIDTH,
        marginLeft: MARGIN_LEFT,
        marginRight: MARGIN_RIGHT,
        padding: 15,
    },
});
