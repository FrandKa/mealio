// app/(auth)/_layout.tsx
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons'; // For back button

export default function AuthLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const themedColors = Colors[colorScheme];
    const router = useRouter();

    return (
        <View style={[styles.background, { backgroundColor: themedColors.authBackground || '#2C1D4A' }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Adjust if needed
            >
                <Stack
                    screenOptions={{
                        headerShown: true, // 显示头部以放置返回按钮
                        headerTransparent: true, // 使头部背景透明
                        headerTitle: '', // 不显示标题文字
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                                <Ionicons name="arrow-back" size={28} color={themedColors.inputText || '#FFFFFF'} />
                            </TouchableOpacity>
                        ),
                        animation: 'slide_from_right',
                    }}
                >
                    {/*
                      Expo Router 会自动从 (auth) 目录中发现这些屏幕。
                      例如 login.tsx, register-credentials.tsx 等。
                      你不需要在这里显式列出 Stack.Screen，除非你想覆盖特定屏幕的选项。
                    */}
                    {/*
                      示例：如果想为特定屏幕自定义选项
                      <Stack.Screen name="login" options={{ headerLeft: () => null }} /> // 比如登录页不显示返回按钮
                    */}
                </Stack>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
});
