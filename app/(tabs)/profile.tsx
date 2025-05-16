// app/(tabs)/profile.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Platform,
    Dimensions, // 导入 Dimensions
} from 'react-native';
import { useAuth } from '@/constants/AuthContext';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons'; // MaterialIcons, Feather 不再直接使用，按需添加
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient'; // 导入 LinearGradient

const { width: screenWidth, height: screenHeight } = Dimensions.get('window'); // 获取屏幕尺寸

interface UserProfileData {
    userId: string;
    username?: string;
    phone?: string;
    nickname?: string;
    avatar?: string;
    gender?: string;
}

export default function ProfileScreen() {
    const { signOut, user: authUser, fetchUserProfile, session } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const themedColors = Colors[colorScheme];
    const router = useRouter();

    const [profileData, setProfileData] = useState<UserProfileData | null>(authUser);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const backgroundGradientColors = colorScheme === 'dark'
        ? ['#4A00E0', '#8E2DE2', '#360033'] // 深色模式下的淡紫色渐变 (与 about.tsx 保持一致或自定义)
        : ['#9845e8', '#ac5ae8', '#e7a3ff']; // 浅色模式下的淡紫色渐变

    const loadProfile = useCallback(async () => { /* ... (保持不变) ... */
        if (!session) return;
        setIsLoadingProfile(true);
        try {
            const fetchedProfile = await fetchUserProfile();
            if (fetchedProfile) {
                setProfileData(fetchedProfile);
            }
        } catch (error) {
            console.error("Failed to load profile in ProfileScreen:", error);
        } finally {
            setIsLoadingProfile(false);
            setIsRefreshing(false);
        }
    }, [fetchUserProfile, session]);

    useEffect(() => { /* ... (保持不变) ... */
        if (authUser) {
            setProfileData(authUser);
        }
        if (authUser && (!authUser.avatar || !authUser.nickname || !authUser.phone)) { // 检查 phone
            loadProfile();
        } else if (!authUser && session){
            loadProfile();
        }
    }, [authUser, loadProfile, session]);

    const onRefresh = useCallback(() => { /* ... (保持不变) ... */
        setIsRefreshing(true);
        loadProfile();
    }, [loadProfile]);

    const handleSignOut = async () => { /* ... (保持不变) ... */
        Alert.alert("退出登录", "您确定要退出登录吗？", [
            { text: "取消", style: "cancel" },
            { text: "确定", onPress: async () => await signOut(), style: "destructive" }
        ]);
    };

    const menuItems = [
        { id: 'settings', title: '设置', icon: 'settings-outline', library: Ionicons, screen: '/(app)/setting' }, // 使用 outline 图标
        { id: 'about', title: '关于我们', icon: 'information-circle-outline', library: Ionicons, screen: '/(app)/about' },
        { id: 'help', title: '帮助与反馈', icon: 'help-circle-outline', library: Ionicons, screen: '/(app)/help' },
    ];

    const renderPlaceholderAvatar = () => ( /* ... (保持不变) ... */
        <View style={[styles.avatar, { backgroundColor: themedColors.placeholderBg }]}>
            <Ionicons name="person" size={Layout.screen.width * 0.12} color={themedColors.icon} />
        </View>
    );


    if (isLoadingProfile && !profileData && !isRefreshing) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themedColors.tint} />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.outerContainer, {backgroundColor: themedColors.background}]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={themedColors.tint} />}
                contentContainerStyle={styles.scrollContentContainer}
            >
                {/* 顶部渐变背景 */}
                <LinearGradient
                    colors={backgroundGradientColors}
                    style={styles.profileHeaderBackground}
                />

                {/* 用户信息卡片 - 现在独立于渐变背景，悬浮其上 */}
                <View style={styles.profileCard}>
                    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.avatarWrapper}>
                        {profileData?.avatar ? (
                            <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
                        ) : (
                            renderPlaceholderAvatar()
                        )}
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.userInfo}>
                        <ThemedText type="titleM" style={styles.nickname}>
                            {profileData?.nickname || '用户昵称'}
                        </ThemedText>
                        {profileData?.username && ( // 显示用户名作为小字
                            <ThemedText style={[styles.usernameText, {color: themedColors.textSubtle}]}>
                                @{profileData.username}
                            </ThemedText>
                        )}
                        {profileData?.phone && (
                            <View style={styles.phoneContainer}>
                                <Ionicons name="call-outline" size={16} color={themedColors.textSubtle} style={styles.infoIcon} />
                                <ThemedText style={[styles.phoneText, {color: themedColors.textSubtle}]}>{profileData.phone}</ThemedText>
                            </View>
                        )}
                    </Animated.View>
                </View>


                {/* 菜单列表 */}
                <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.menuSection}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.menuItem,
                                { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor },
                                index === menuItems.length - 1 && styles.menuItemLast
                            ]}
                            onPress={() => item.screen ? router.push(item.screen as any) : Alert.alert(item.title, "功能开发中")}
                        >
                            <View style={styles.menuItemContent}>
                                <Ionicons name={item.icon as any} size={24} color={themedColors.tint} style={styles.menuItemIcon} />
                                <ThemedText style={styles.menuItemText}>{item.title}</ThemedText>
                            </View>
                            <Ionicons name="chevron-forward" size={22} color={themedColors.textSubtle} />
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* 退出登录按钮 - 雾玻璃效果 */}
                <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.logoutButtonOuterContainer}>
                    <TouchableOpacity
                        style={[styles.logoutButton, { backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.2)' : themedColors.cardBg }]} // iOS上模拟雾玻璃的半透明背景
                        onPress={handleSignOut}
                    >
                        {Platform.OS === 'ios' && ( // 仅在iOS上尝试添加模糊效果的底层（如果安装了 react-native-blur）
                            <View style={[StyleSheet.absoluteFillObject, styles.blurViewIOS, {backgroundColor: themedColors.backgroundOpacified }]} />
                        )}
                        <Text style={[styles.logoutButtonText, { color: Colors.common.danger }]}>退出登录</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContentContainer: {
        paddingBottom: Layout.spacing.xxl + Layout.spacing.lg, // 增加底部空间
    },
    profileHeaderBackground: { // 新的渐变背景样式
        height: screenHeight * 0.25, // 背景高度
        width: '100%',
        position: 'absolute', // 作为绝对定位的背景层
        top: 0,
        left: 0,
        right: 0,
        borderBottomLeftRadius: Layout.borderRadius.xl * 2, // 大圆角
        borderBottomRightRadius: Layout.borderRadius.xl * 2,
    },
    profileCard: { // 用户信息卡片，悬浮在渐变背景之上
        alignItems: 'center',
        marginTop: screenHeight * 0.12, // 向上推，使其部分与渐变背景重叠
        marginHorizontal: Layout.spacing.page,
        paddingTop: (Layout.screen.width * 0.28 / 2) + Layout.spacing.md, // 为头像顶部留出空间
        paddingBottom: Layout.spacing.lg,
        backgroundColor: Colors.light.cardBg, // 卡片背景总是浅色（或根据主题）
        borderRadius: Layout.borderRadius.xl,
        ...Layout.shadow.md, // 应用阴影
        elevation: 8,
        marginBottom: Layout.spacing.lg, // 卡片和菜单之间的间距
    },
    avatarWrapper: { // 包裹头像，使其能通过负 margin 定位
        marginTop: -(Layout.screen.width * 0.28 / 2), // 将头像向上拉，使其中心位于卡片顶部边缘
        marginBottom: Layout.spacing.md,
    },
    avatar: {
        width: Layout.screen.width * 0.28, // 头像尺寸增大
        height: Layout.screen.width * 0.28,
        borderRadius: (Layout.screen.width * 0.28) / 2,
        borderWidth: 4, // 边框加粗
        borderColor: Colors.light.cardBg, // 头像边框与卡片背景色一致
        backgroundColor: Colors.light.placeholderBg, // 占位符背景
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        alignItems: 'center',
        marginTop: Layout.spacing.xs,
    },
    nickname: {
        fontSize: Layout.fontSize.titleM, // 昵称使用 titleM
        fontWeight: Layout.fontWeight.bold,
        marginBottom: Layout.spacing.xxs,
    },
    usernameText: { // 新增：用户名样式
        fontSize: Layout.fontSize.sm,
        marginBottom: Layout.spacing.sm,
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: { // 用于电话等图标
        marginRight: Layout.spacing.xs,
    },
    phoneText: {
        fontSize: Layout.fontSize.md,
    },
    menuSection: {
        marginHorizontal: Layout.spacing.page,
        borderRadius: Layout.borderRadius.lg, // 给整个section圆角
        overflow: 'hidden', // 确保子项圆角裁切
        backgroundColor: Colors.light.cardBg, // 菜单区域背景
        ...Layout.shadow.sm,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Layout.spacing.lg - Layout.spacing.xxs, // 增加垂直padding
        paddingHorizontal: Layout.spacing.md,
        // backgroundColor 由 menuSection 控制，这里移除
        borderBottomWidth: StyleSheet.hairlineWidth,
        // borderColor 由 themedColors.borderColor 设置
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemIcon: { // 新增：菜单项图标样式
        marginRight: Layout.spacing.lg, // 图标和文字间距增大
    },
    menuItemText: {
        fontSize: Layout.fontSize.lg,
    },
    logoutButtonOuterContainer: { // 用于应用阴影和边距
        marginHorizontal: Layout.spacing.page,
        marginTop: Layout.spacing.xl,
        borderRadius: Layout.borderRadius.xl, // 与按钮一致
        ...Layout.shadow.md, // 给按钮容器一点阴影
        elevation: 5,
    },
    logoutButton: {
        paddingVertical: Layout.spacing.md + 2,
        borderRadius: Layout.borderRadius.xl, // 更圆润
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor 通过 Platform.OS 设置
        // borderWidth: 0, // 移除边框，依赖背景和阴影
        overflow: 'hidden', // 对于模拟雾玻璃效果可能需要
    },
    blurViewIOS: { // 用于 iOS 模拟雾玻璃的底层模糊
        // 如果使用 react-native-blur, 这里会是 <BlurView>
        // 手动模拟的话，是一个半透明的背景
        borderRadius: Layout.borderRadius.xl, // 与按钮一致
        // backgroundColor 由 themedColors.backgroundOpacified 设置
    },
    logoutButtonText: {
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.bold, // 加粗退出登录文字
    },
});
