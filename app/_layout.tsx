// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React, {useContext, useEffect} from 'react';
import { Slot, SplashScreen, useRouter, useSegments, Stack } from 'expo-router';
import { AuthContext, AuthProvider, useAuth } from '@/constants/AuthContext'; // AuthContext 也需要导入（虽然 useAuth 内部会用）
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors'; // 引入你的 Colors
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font'; // 确保已导入 useFonts

// SplashScreen.preventAutoHideAsync(); // 移到组件内部或只调用一次

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        // 添加你项目中使用的其他自定义字体
    });

    // 将 preventAutoHideAsync 移到 useEffect 中，并确保只在 fontsLoaded 后 hide
    useEffect(() => {
        SplashScreen.preventAutoHideAsync();
    }, []);


    if (!fontsLoaded) {
        return null; // 在字体加载完成前不渲染任何东西，SplashScreen 会继续显示
    }

    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}

function RootLayoutNav() {
    const rawAuthContext = useContext(AuthContext); // <--- 直接使用 React 的 useContext
    console.log('RAW AuthContext value in RootLayoutNav:', rawAuthContext); // 打印这个值

    // 然后再尝试安全地访问
    const session = rawAuthContext?.session;
    const isLoadingAuth = rawAuthContext?.isLoading ?? true;

    const segments = useSegments();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const currentNavigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

    // 为了让主题颜色与你的 Colors.ts 匹配，你需要扩展 DefaultTheme/DarkTheme
    const myNavigationTheme = {
        ...currentNavigationTheme, // 从 React Navigation 的默认主题开始
        colors: {
            ...currentNavigationTheme.colors, // 保留默认颜色
            primary: Colors[colorScheme].tint, // 覆盖你需要的颜色
            background: Colors[colorScheme].background,
            card: Colors[colorScheme].cardBg,
            text: Colors[colorScheme].text,
            border: Colors[colorScheme].borderColor,
            notification: Colors[colorScheme].tint,
        },
    };

    useEffect(() => {
        if (isLoadingAuth) {
            console.log("Auth state is loading...");
            return; // 等待 session 加载完毕
        }

        console.log('Auth Session:', session ? 'Exists' : 'None');
        console.log('Current Segments:', segments);

        // 检查当前是否在认证相关的路由组中
        // `segments` 是一个数组，例如 `['(auth)', 'login']` 或 `['(tabs)', 'index']`
        const inAuthFlow = segments[0] === '(auth)' || segments[0] === 'welcome';
        const inAppTabs = segments[0] === '(tabs)';

        if (!session && !inAuthFlow) {
            // 如果没有 session (未登录) 且当前不在认证流程或欢迎页
            // 则重定向到欢迎页。
            // 需要排除Expo Router的内部路由如 _sitemap, +not-found
            if (segments.length > 0 && segments[0] !== '_sitemap' && segments[0] !== '+not-found') {
                console.log('Redirecting to /welcome (no session, not in auth flow)');
                router.replace('/welcome');
            }
        } else if (session && (inAuthFlow || segments.length === 0 )) {
            // 如果有 session (已登录) 且当前在认证流程中，或在根路径 (segments.length === 0)
            // 则重定向到主应用 (tabs) 的首页。
            console.log('Redirecting to /(tabs)/ (has session, was in auth flow or root)');
            router.replace('/(tabs)/profile'); // 你的 (tabs) 首页
        }

        // 当认证状态和路由都稳定后，隐藏启动屏
        // 确保 isLoadingAuth 为 false 且 fontsLoaded (来自 RootLayout) 也为 true
        if (!isLoadingAuth) {
            SplashScreen.hideAsync();
        }

    }, [session, segments, isLoadingAuth, router]);


    if (isLoadingAuth) {
        // 在认证状态加载时，可以显示全屏加载指示器或保持启动屏
        // 返回 null 会让启动屏继续显示，这通常是期望的行为
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider value={myNavigationTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                    {/*
                      定义顶级路由。
                      Expo Router 会根据文件名和目录结构自动匹配。
                    */}
                    <Stack.Screen name="welcome" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    {/*<Stack.Screen name="detail" /> /!* 详情页是顶级页面 *!/*/}
                    {/* test.tsx 也会自动成为一个可访问的顶级路由 /test */}
                    {/* +not-found 会被自动处理 */}
                </Stack>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}
