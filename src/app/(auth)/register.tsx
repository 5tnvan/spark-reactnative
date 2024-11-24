import React, { useEffect, useState } from "react";
import { Icon, Input } from "react-native-elements";
import {
  Alert,
  View,
  AppState,
  Pressable,
  Text,
  ImageBackground,
  StyleSheet,
  useColorScheme,
  Image,
  TouchableOpacity
} from "react-native";
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Checkbox } from "expo-checkbox";

import { supabase } from "@/src/lib/supabase";
import { Link } from "expo-router";
import { AuthApple } from "@/src/components/auth/AuthApple";

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<boolean>();
  const [eulaChecked, setEulaChecked] = useState(false);

  async function checkUsernameAvail(username: string) {
    const { data } = await supabase.from("profiles").select().eq("username", username);

    return !!(data?.length ?? 0);
  }

  async function signUpWithEmail() {
    setLoading(true);

    if (username.length < 3) {
      Alert.alert("Username is too short.");
      setLoading(false);
      return;
    }

    if (!/^[a-z0-9][a-z0-9_]{2,15}$/.test(username)) {
      Alert.alert("Username must start with a lowercase letter or digit and be between 3 and 16 characters long, containing only lowercase letters, digits, or underscores.");
      setLoading(false);
      return;
    }

    if (await checkUsernameAvail(username)) {
      Alert.alert("Username has already been taken.");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      Alert.alert("Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one digit.");
      setLoading(false);
      return;
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) Alert.alert(error.message);
    else if (!session)
      Alert.alert("Please check your inbox for email verification!");

    setLoading(false);
  }

  //Check if username is available
  useEffect(() => {
    (async () => {
      if (username.length > 3) {
        const taken = await checkUsernameAvail(username.toLowerCase());
        if (!taken) setAvailable(true); else setAvailable(false);
      }
    })();
  }, [username]);


  return (
    <View className="flex flex-col justify-content px-4 grow">
      {/* Create a wildpay account */}
      <View className="flex flex-row items-center justify-center my-5">
        <Text className="text-lg text-black dark:text-white mr-2 font-bold">
          Create a
        </Text>
        <Image
          source={require("@/assets/images/kinnect/faviconkinnect.png")}
          className="w-5 h-5 mr-1"
        />
        <Text className="text-lg font-bold mr-2" style={{ color: '#3D45E7' }}>Kinnect</Text>
        <Text className="text-lg text-black dark:text-white font-bold">
          account
        </Text>
      </View>

      {/* Card */}
      <View className="flex-row items-center justify-center relative">
        <View style={styles.imageContainer} className="mb-10">
          <ImageBackground
            source={require("@/assets/images/wildpay-card-03.png")}
            className={`flex-1 justify-center overflow-hidden rounded-2xl border-2 ${colorScheme == "dark" ? "border-zinc-600" : "border-white"}`}
          >
            <View className="absolute flex-row top-2 left-2 gap-1">
              <Pressable className="bg-fuchsia-400 rounded-full p-1 pr-2 pl-2 border border-fuchsia-300 flex-row items-center">
                <FontAwesome5 name="ethereum" size={14} color="#333" />
                <Text className="ml-1">Ethereum</Text>
              </Pressable>
              <Pressable className="bg-fuchsia-400 rounded-full p-1 pr-2 pl-2 border border-fuchsia-300 flex-row items-center">
                <Image
                  source={require('@/assets/images/Base_Symbol_Black.png')}
                  className="w-3 h-3 mr-1"
                />
                <Text>Base</Text></Pressable>
            </View>
            <Text className={`text-5xl font-extrabold text-white`}>
              {username == "" ? "" : username}
            </Text>

          </ImageBackground>
        </View>
      </View>

      <View className="w-full">
        <View>
          <Input
            label="Username"
            leftIcon={{ type: "font-awesome", name: "user" }}
            onChangeText={(text) => setUsername(text.toLowerCase())}
            value={username}
            placeholder="username"
            autoCapitalize="none"
            maxLength={16}
            className={`${colorScheme == 'dark' ? 'text-gray-200' : 'text-gray-800'}`}
            rightIcon={
              <Pressable>
                {username.length > 3 &&
                  <Ionicons
                    name={available ? "checkmark-circle-outline" : "alert-circle-outline"} // Set name to undefined when not available
                    size={24}
                    color={available ? "green" : "red"}
                  />}
              </Pressable>
            }
          />
        </View>

        <View>
          <Input
            label="Email"
            leftIcon={{ type: "font-awesome", name: "envelope" }}
            onChangeText={(text) => setEmail(text)}
            value={email}
            placeholder="email@address.com"
            autoCapitalize={"none"}
            className={colorScheme == "dark" ? 'text-white' : 'text-black'}
          />
        </View>

        <View>
          <Input
            label="Password"
            leftIcon={{ type: "font-awesome", name: "lock" }}
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry={true}
            placeholder="Password"
            autoCapitalize={"none"}
            className={colorScheme == "dark" ? 'text-white' : 'text-black'}
          />
        </View>

        {/* Checkbox for EULA */}
        <View className="flex-row items-center mb-5">
          <Checkbox
            value={eulaChecked}
            onValueChange={setEulaChecked}
            color={eulaChecked ? '#FFAA00' : undefined}
          />
          <Text className="ml-2 text-black dark:text-white">
            I agree with the <Link href="/modals/eula-terms-modal" className="text-accent">EULA terms</Link>
          </Text>
        </View>

        <View className="items-center mb-5">

          <TouchableOpacity
            className={`w-full items-center justify-center p-3 rounded-full ${loading || !eulaChecked  ? "bg-zinc-400" : "bg-accent"}`}
            disabled={loading || !eulaChecked}
            onPress={() => signUpWithEmail()}
          >
            <Text className="text-lg text-black font-semibold">Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: "80%",
    aspectRatio: 315 / 200, // Maintain aspect ratio (width / height)
  },
});