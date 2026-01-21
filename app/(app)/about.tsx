// app/(app)/settings/about.tsx
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import Constants from 'expo-constants'; // 用于状态栏高度
import { LinearGradient } from 'expo-linear-gradient'; // 用于背景渐变
import React from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInUp, ZoomIn } from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AboutScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const themedColors = Colors[colorScheme];

    // 背景渐变颜色 - 可以根据主题调整
    const backgroundGradientColors = colorScheme === 'dark'
        ? ['#4A00E0', '#8E2DE2', '#360033'] // 深色模式下的淡紫色渐变 (示例)
        : ['#9845e8', '#ac5ae8', '#e7a3ff']; // 浅色模式下的淡紫色渐变


    return (
        <ThemedView style={styles.outerContainer}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContentContainer}>
                <View style={styles.mainContent}>
                    <View style={styles.heroBackgroundContainer}>
                        <LinearGradient
                            colors={backgroundGradientColors}
                            style={styles.heroBackgroundShape}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <Animated.View
                            style={styles.logoImageContainer}
                            entering={ZoomIn.delay(400).duration(800).easing(Easing.out(Easing.exp))}
                        >
                            <Image
                                source={require('@/assets/images/logo.png')}
                                style={styles.logoImage}
                            />
                        </Animated.View>
                    </View>

                    {/* 文本信息 */}
                    <Animated.View style={styles.textInfoContainer} entering={FadeInUp.delay(600).duration(800)}>
                        <ThemedText type="titleL" style={styles.appNameText}>
                            Mealio
                        </ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.taglineText}>
                            FrandKa 出品
                        </ThemedText>
                        <View style={styles.statsContainer}>
                            <ThemedText style={styles.statText}>中国 南京</ThemedText>
                            <Text style={[styles.statDivider, {color: themedColors.textSubtle}]}>•</Text>
                            <ThemedText style={styles.statText}>100k+ 用户</ThemedText>
                            <Text style={[styles.statDivider, {color: themedColors.textSubtle}]}>•</Text>
                            <ThemedText style={styles.statText}>5星 好评</ThemedText>
                        </View>
                        <ThemedText style={[styles.descriptionText, { color: themedColors.textSubtle }]}>
                            欢迎来到 Mealio，您的一站式美食探索与分享平台！我们致力于连接美食爱好者与本地优质餐厅，让每一次用餐都成为一次愉快的发现之旅。
                            在这里，您可以轻松浏览附近的餐厅，查看真实的用户评价，发现隐藏的美味佳肴。Mealio 不仅仅是一个应用，更是一个热爱美食的社区。
                            无论您是寻找浪漫的约会餐厅，还是家庭聚餐的温馨场所，亦或是快速解决工作餐的便捷选择，Mealio 都能满足您的需求。
                            我们的使命是让每个人都能更简单、更快乐地享受美食。感谢您的支持，与 Mealio 一同开启美味生活！
                        </ThemedText>
                    </Animated.View>

                    {/* 标签/关键词 (可选) */}
                    <Animated.View style={styles.tagsContainer} entering={FadeInUp.delay(800).duration(800)}>
                        {['便捷', '发现', '美味', '社区', '分享'].map((tag) => (
                            <View key={tag} style={[styles.tag, { backgroundColor: themedColors.placeholderBg }]}>
                                <ThemedText style={[styles.tagText, { color: themedColors.textSubtle }]}>{tag}</ThemedText>
                            </View>
                        ))}
                    </Animated.View>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: Layout.spacing.xxl,
    },
    topLogoContainer: {
        alignItems: 'center',
        paddingTop: (Platform.OS === 'android' ? Constants.statusBarHeight : 0) + Layout.spacing.md, // 安卓考虑状态栏，iOS导航栏已处理
        paddingBottom: Layout.spacing.sm,
        // backgroundColor: themedColors.background, // 与页面背景一致
    },
    topLogoText: {
        fontSize: Layout.fontSize.titleM + 4, // 比 titleM 稍大
        fontWeight: Layout.fontWeight.bold, // 或 'black'
        // color 由 themedColors.primary 设置
        fontFamily: 'SpaceMono', // 或你的品牌字体
        letterSpacing: 1,
    },
    mainContent: {
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.page, // 页面左右内边距
    },
    heroBackgroundContainer: {
        width: screenWidth, // 占据整个屏幕宽度
        height: screenHeight * 0.35, // 背景高度，可调整
        alignItems: 'center', // 使圆形 logo 居中
        justifyContent: 'flex-start', // 使 logo 偏上
        marginBottom: (screenWidth * 0.4) / 2 + Layout.spacing.lg, // 为圆形 logo 底部留出空间并加上额外间距
        position: 'relative', // 为了子元素绝对定位
    },
    heroBackgroundShape: {
        width: '110%', // 比屏幕略宽，以确保覆盖边缘
        height: '100%',
        position: 'absolute',
        top: 0,
        borderBottomLeftRadius: Layout.borderRadius.xl * 2.5, // 大圆角模拟缺口效果
        borderBottomRightRadius: Layout.borderRadius.xl * 2.5,
        // transform: [{skewY: '-5deg'}] // 可选：轻微倾斜增加动感
    },
    logoImageContainer: {
        width: screenWidth * 0.4,
        height: screenWidth * 0.4,
        borderRadius: (screenWidth * 0.4) / 2,
        backgroundColor: Colors.light.cardBg, // 这个背景色可能在图片完全覆盖后不可见
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: -(screenWidth * 0.4) / 2,
        ...Layout.shadow.lg,
        elevation: 10,
    },
    logoImage: {
        width: '100%', // 图片宽度与容器相同
        height: '100%', // 图片高度与容器相同
        borderRadius: (screenWidth * 0.4) / 2, // <--- 关键：在 Image 上应用 borderRadius
    },
    textInfoContainer: {
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.md,
        marginTop: Layout.spacing.md, // 圆形logo与文本之间的间距
    },
    appNameText: {
        fontSize: Layout.fontSize.display, // 使用 ThemedText type="titleL"
        fontWeight: Layout.fontWeight.bold,
        marginBottom: Layout.spacing.xs,
    },
    taglineText: {
        fontSize: Layout.fontSize.md,
        // color 由 themedColors.textSubtle 设置
        marginBottom: Layout.spacing.lg,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Layout.spacing.lg,
        flexWrap: 'wrap',
    },
    statText: {
        fontSize: Layout.fontSize.sm,
        marginHorizontal: Layout.spacing.xs,
    },
    statDivider: {
        fontSize: Layout.fontSize.sm,
    },
    descriptionText: {
        textAlign: 'center',
        lineHeight: Layout.fontSize.lg * 1.5, // 增加行高以提高可读性
        fontSize: Layout.fontSize.md,
        marginBottom: Layout.spacing.xl,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        // marginBottom: Layout.spacing.xl, // 已在 scrollContentContainer 中有 paddingBottom
    },
    tag: {
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm - 2,
        borderRadius: Layout.borderRadius.pill,
        margin: Layout.spacing.xs,
    },
    tagText: {
        fontSize: Layout.fontSize.sm,
        fontWeight: Layout.fontWeight.medium,
    },
});
