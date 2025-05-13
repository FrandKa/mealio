// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'; // 引入图标库
import Colors from '@/constants/Colors'; // 引入我们定义的颜色
import { useColorScheme } from '@/hooks/useColorScheme'; // 您项目已有的 hook

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
            <Tabs.Screen
                name="explore" // 对应 app/(tabs)/explore.tsx 文件
                options={{
                    title: '发现',
                    tabBarIcon: ({ color, focused }) => (
                        // HTML 使用 far fa-compass (FontAwesome Pro), FontAwesome 免费版是 fas fa-compass
                        <TabBarIcon name="compass" color={focused ? activeColor : inactiveColor} library="FontAwesome" />
                    ),
                }}
            />
            <Tabs.Screen
                name="list" // 对应 app/(tabs)/list.tsx 文件
                options={{
                    title: '清单',
                    tabBarIcon: ({ color, focused }) => (
                        // HTML 使用 fas fa-shopping-cart
                        <TabBarIcon name="shopping-cart" color={focused ? activeColor : inactiveColor} library="FontAwesome" />
                    ),
                    // tabBarBadge: 3, // 示例：显示角标，后续可以动态化
                }}
            />
            <Tabs.Screen
                name="notifications" // 对应 app/(tabs)/notifications.tsx 文件
                options={{
                    title: '通知',
                    tabBarIcon: ({ color, focused }) => (
                        // HTML 使用 far fa-bell, Ionicons 有 outline 版本
                        <TabBarIcon name={focused ? "notifications" : "notifications-outline"} color={focused ? activeColor : inactiveColor} library="Ionicons" />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile" // 对应 app/(tabs)/profile.tsx 文件
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
