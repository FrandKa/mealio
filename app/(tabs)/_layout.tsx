// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'; // 引入图标库
import Colors from '@/constants/Colors'; // 引入我们定义的颜色
import { useColorScheme } from '@/hooks/useColorScheme';
import {Platform} from "react-native";
import {profile} from "@expo/fingerprint/build/utils/Profile";
import {useAuth} from "@/constants/AuthContext"; // 您项目已有的 hook

// 一个简单的 TabBarIcon 组件
function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>['name'] | React.ComponentProps<typeof MaterialCommunityIcons>['name'] | React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    library?: 'FontAwesome' | 'MaterialCommunityIcons' | 'Ionicons'; // 可选，指定图标库
}) {
    const IconComponent = props.library === 'MaterialCommunityIcons' ? MaterialCommunityIcons :
        props.library === 'Ionicons' ? Ionicons :
            FontAwesome;
    // @ts-ignore (忽略 name 类型不完全匹配的问题，因为我们是动态选择组件)
    return <IconComponent size={26} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
    const colorScheme = useColorScheme() ?? 'light'; // 处理 null 的情况
    const activeColor = Colors[colorScheme].tabIconSelected;
    const inactiveColor = Colors[colorScheme].tabIconDefault;
    const { cartItemCount } = useAuth();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: activeColor,
                tabBarInactiveTintColor: inactiveColor,
                tabBarStyle: {
                    backgroundColor: Colors[colorScheme].cardBg, // 底部导航背景色
                    // borderTopColor: Colors[colorScheme].borderColor, // 可选的顶部边框
                    // height: Layout.bottomNavHeight, // 也可以从 Layout常量中获取
                },
                headerShown: false, // 我们将使用自定义的 AppHeader，所以禁用默认头部
            }}>
            <Tabs.Screen
                name="index" // 对应 app/(tabs)/index.tsx 文件
                options={{
                    title: '首页',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name="home" color={focused ? activeColor : inactiveColor} library="FontAwesome" />
                    ),
                }}
            />
            {/* 根据平台条件渲染 '发现' Tab */}
            {Platform.OS === 'web' ? (
                <Tabs.Screen
                    name="explore" // Web 平台，"发现" Tab 指向 profile 页面
                    options={{
                        title: '发现 (Web)', // 或者你可以保持叫 '发现'，但内容是 profile
                        tabBarIcon: ({ color, focused }) => (
                            // 可以使用不同的图标，或者保持 'compass' 图标但指向 profile
                            <TabBarIcon name="user" color={focused ? activeColor : inactiveColor} library="FontAwesome" />
                        ),
                        // href: '/profile', // 如果 name 与文件名不匹配，可能需要 href (但这里 name="profile" 应该能找到 app/(tabs)/profile.tsx)
                    }}
                />
            ) : (
                <Tabs.Screen
                    name="explore" // 其他平台 (iOS, Android)，"发现" Tab 指向 explore 页面
                    options={{
                        title: '发现',
                        tabBarIcon: ({ color, focused }) => (
                            <TabBarIcon name="compass" color={focused ? activeColor : inactiveColor} library="FontAwesome" />
                        ),
                    }}
                />
            )}
            <Tabs.Screen
                name="list" // 对应 app/(tabs)/list.tsx 文件
                options={{
                    title: '清单',
                    tabBarIcon: ({ color, focused }) => (
                        // HTML 使用 fas fa-shopping-cart
                        <TabBarIcon name="shopping-cart" color={focused ? activeColor : inactiveColor} library="FontAwesome" />
                    ),
                    tabBarBadge: cartItemCount, // 示例：显示角标，后续可以动态化
                }}
            />
            <Tabs.Screen
                name='profile' // 对应 app/(tabs)/profile.tsx 文件
                options={{
                    title: '我的',
                    tabBarIcon: ({ color, focused }) => (
                        // HTML 使用 far fa-user, FontAwesome 免费版是 fas fa-user
                        <TabBarIcon name="user" color={focused ? activeColor : inactiveColor} library="FontAwesome" />
                    ),
                }}
            />
        </Tabs>
    );
}
