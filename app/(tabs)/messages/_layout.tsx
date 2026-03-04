import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export default function MessagesLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Chats",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Chat",
          headerShown: true,
          header: () => (
            <View
              style={{
                height: 40,
                backgroundColor: "#fff",
                justifyContent: "center",
                alignItems: "flex-start",
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
                paddingTop: 8,
                paddingLeft: 40,
              }}
            >
            </View>
          ),
        }}
      />
    </Stack>
  );
}
