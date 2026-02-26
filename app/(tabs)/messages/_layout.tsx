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
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ position: "absolute", left: 12, top: 2 }}
              >
                <Ionicons name="chevron-back" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
    </Stack>
  );
}
