import React from 'react';
import Colors from '@/src/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { Avatar } from '@/src/components/avatars/avatar';
import { Redirect, Stack, Tabs, useSegments } from 'expo-router';
import { useColorScheme } from '@/src/components/useColorScheme';
import { useClientOnlyValue } from '@/src/components/useClientOnlyValue';
import { useAuth } from '../../services/providers/AuthProvider';
import AuthUserProvider, { useAuthUser } from '../../services/providers/AuthUserProvider';
import AuthUserFollowsProvider from '@/src/services/providers/AuthUserFollowsProvider';
import AuthUserNotificationProvider, { useAuthUserNotifications } from '@/src/services/providers/AuthUserNotificationProvider';
import { View } from 'react-native';



/** 
 * TAB BAR ICON
 * Icons: https://icons.expo.fyi/
 * **/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof AntDesign>['name'];
  color: string;
}) {
  return <AntDesign size={28} style={{ marginBottom: -3 }} {...props} />;
}

/** 
 * PROTECTED LAYOUT NAVIGATION
 * **/
function ProtectedLayoutNav() {
  const segment = useSegments();
  const colorScheme = useColorScheme();

  //CONSUME PROVIDERS
  const { profile } = useAuthUser();
  const { isLoading, followersNotifications, refetch } = useAuthUserNotifications();

  //UNREAD NOTIFICATIONS
  const unreadNotifications = followersNotifications?.filter((notification: any) => !notification.follower_read);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, false),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color}
           />
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => <TabBarIcon name="pluscircleo" color={color} />,
        }}
      />
      <Tabs.Screen
        name="threesecs"
        options={{
          title: '3 sec',
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => <MaterialIcons name="123" style={{ marginBottom: -3 }} size={40} color={color} />,
          tabBarStyle: { display: segment[1] === "threesecs" ? 'none' : 'flex' } //hide tab bar for this screen
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => <MaterialIcons name="app-shortcut" style={{ marginBottom: -3 }} size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => 
            <View>
              <Avatar avatar_url={profile?.avatar_url} username={profile?.username} size={'sm'} ring={true} />
              {unreadNotifications && unreadNotifications.length > 0 && <View className="absolute right-1 top-0 w-2 h-2 rounded-full bg-red-600 border border-white"></View>}
            </View>
          ,
        }}
      />
      {/* <Tabs.Screen name="modals/follows-modal" options={{ href: null }} /> */}
    </Tabs>
  );
}

/** 
 * PROTECTED LAYOUT
 * _layout for /(protected)
 * **/
export default function ProtectedLayout() {

  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <>
    <AuthUserProvider>
      <AuthUserNotificationProvider>
        <AuthUserFollowsProvider>
            <ProtectedLayoutNav />
        </AuthUserFollowsProvider>
      </AuthUserNotificationProvider>
    </AuthUserProvider>
    </>
    
  );
}
