// app/welcome.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform } from 'react-native'; // 移除了 Image
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn, Easing, useSharedValue, useAnimatedStyle, withTiming, withRepeat, interpolate, Extrapolate, SlideInDown } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { ThemedText } from '@/components/ThemedText'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ... CircleShape 和 WavyLine 组件保持不变 ...
const CircleShape = ({ size, color, style }: { size: number; color: string; style?: any }) => (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
);
const WavyLine = ({ color, style, width = 100, height = 50 }: {color: string, style?: any, width?: number, height?: number}) => (
    <View style={[{ width, height, overflow: 'hidden' }, style]}>
        <View style={{width: width * 1.5, height: height * 1.5, borderRadius: width, borderWidth: height/5, borderColor: color, transform: [{translateX: -width * 0.25}, {translateY: -height * 0.5}] }} />
    </View>
);


export default function WelcomeScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const themedColors = Colors[colorScheme];

    const animValue1 = useSharedValue(0);
    const animValue2 = useSharedValue(0);

    useEffect(() => {
        animValue1.value = withRepeat(withTiming(1, { duration: 5000, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
        animValue2.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.bezier(0.32, 0, 0.67, 1) }), -1, true);
    }, [animValue1, animValue2]);

    const animatedStyle1 = useAnimatedStyle(() => { /* ...保持不变... */
        const translateY = interpolate(animValue1.value, [0, 1], [-10, 10], Extrapolate.CLAMP);
        const scale = interpolate(animValue1.value, [0, 0.5, 1], [1, 1.05, 1], Extrapolate.CLAMP);
        return { transform: [{ translateY }, {scale}] };
    });
    const animatedStyle2 = useAnimatedStyle(() => { /* ...保持不变... */
        const translateX = interpolate(animValue2.value, [0, 1], [-8, 8], Extrapolate.CLAMP);
        const scale = interpolate(animValue2.value, [0, 0.5, 1], [1, 1.03, 1], Extrapolate.CLAMP);
        return { transform: [{ translateX }, {scale}] };
    });

    const BackgroundGraphics = () => ( /* ...保持不变... */
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Animated.View style={animatedStyle1}>
                <CircleShape size={screenWidth * 0.8} color="rgba(138, 43, 226, 0.08)" style={{ position: 'absolute', top: -screenHeight * 0.1, left: -screenWidth * 0.2 }} />
                <CircleShape size={screenWidth * 0.7} color="rgba(75, 0, 130, 0.12)" style={{ position: 'absolute', top: screenHeight * 0.2, right: -screenWidth * 0.3 }} />
            </Animated.View>
            <Animated.View style={[{position: 'absolute', bottom: screenHeight * 0.25, right: -screenWidth * 0.2, transform: [{ rotate: '40deg' }]}]}>
                <WavyLine color="rgba(255, 255, 255, 0.03)" width={screenWidth * 0.8} height={screenHeight * 0.2}/>
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(400).duration(1000).easing(Easing.out(Easing.exp))} style={[styles.graphicElement, { top: screenHeight * 0.08, left: screenWidth * 0.1 }]}>
                <Ionicons name="leaf-outline" size={screenWidth * 0.20} color="rgba(147, 197, 75, 0.5)" />
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(600).duration(1000).easing(Easing.out(Easing.exp))} style={[styles.graphicElement, { top: screenHeight * 0.22, right: screenWidth * 0.12, transform: [{rotate: '15deg'}] }]}>
                <Ionicons name="restaurant-outline" size={screenWidth * 0.15} color="rgba(255, 255, 255, 0.25)" />
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(800).duration(1000).easing(Easing.out(Easing.exp))} style={[styles.graphicElement, { bottom: screenHeight * 0.33, left: screenWidth * 0.18, transform: [{rotate: '-10deg'}] }]}>
                <Ionicons name="nutrition-outline" size={screenWidth * 0.19} color="rgba(255, 165, 0, 0.35)" />
            </Animated.View>
        </View>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: themedColors.authBackground }]}>
            <BackgroundGraphics />

            {/* --- Mealio Logo (艺术字效果) --- */}
            <Animated.View
                // Logo 从上方滑入并淡入，带一点弹性
                entering={SlideInDown.delay(300).duration(1200).springify().damping(15).stiffness(90)}
                style={styles.logoContainer}
            >
                <Text style={[styles.logoText, { color: themedColors.authInputText }]}>
                    Mealio
                </Text>
                {/*<Text style={[styles.logoText, { color: themedColors.authInputText }]}>*/}
                {/*    😋*/}
                {/*</Text>*/}
            </Animated.View>
            {/* --- 结束 Mealio Logo --- */}

            <View style={styles.content}>
                <Animated.View entering={FadeInDown.delay(1000).duration(800).springify().damping(15).stiffness(100)}>
                    <ThemedText type="titleM" style={[styles.welcomeTitle, { color: themedColors.authInputText }]}>
                        欢迎来到 Mealio
                    </ThemedText>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(1200).duration(800)}>
                    <ThemedText style={[styles.subtitle, { color: themedColors.authTextSubtle }]}>
                        为您推荐今天的美食！😋
                    </ThemedText>
                    <ThemedText style={[styles.subtitle, { color: themedColors.authTextSubtle }]}>
                        所有美食，一站汇聚
                    </ThemedText>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(1400).duration(1000)} style={styles.buttonContainer}>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                        <LinearGradient
                            colors={
                                themedColors.authPrimaryButton === themedColors.tint
                                    ? [themedColors.authPrimaryButton, Colors.common.primaryDark || '#5B21B6']
                                    : [themedColors.authPrimaryButton, themedColors.authPrimaryButton]
                            }
                            style={styles.button}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={[styles.buttonText, { color: themedColors.authPrimaryButtonText }]}>登录</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, {
                            backgroundColor: themedColors.authSecondaryButton,
                            borderColor: themedColors.authSecondaryButtonText, // 使用 authSecondaryButtonText 作为边框颜色
                            borderWidth: 1 }
                        ]}
                        onPress={() => router.push('/(auth)/register-credentials')}
                    >
                        <Text style={[styles.buttonText, { color: themedColors.authSecondaryButtonText }]}>注册</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // --- Logo 样式 ---
    logoContainer: {
        alignItems: 'center',
        paddingTop: Constants.statusBarHeight + Layout.spacing.xl, // 顶部安全间距 + 额外间距
        // marginBottom: Layout.spacing.lg, // Logo 和下面欢迎词的间距
        // 使用绝对定位将 Logo 置于顶部，不影响底部内容的 flex-end 对齐
        position: 'absolute',
        left: 0,
        right: 0,
        top: 230,
        zIndex: 2, // 确保在背景图形之上
    },
    logoText: {
        fontSize: Layout.fontSize.display + 12, // 比 display 类型更大一点
        fontWeight: Layout.fontWeight.bold, // 或者 '800' '900' 如果字体支持
        // color 由 themedColors.authInputText 设置
        // 尝试添加一点文字阴影来模拟图片中的效果 (React Native 的文字阴影比较基础)
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 3,
        fontFamily: 'SpaceMono', // 如果你有特定的品牌字体，在这里使用
    },
    // --- 结束 Logo 样式 ---
    graphicElement: {
        position: 'absolute',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: Layout.spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? Layout.spacing.xxl : Layout.spacing.xl + Layout.spacing.sm,
        alignItems: 'center',
        zIndex: 1,
    },
    welcomeTitle: { // 之前是 styles.title
        // fontSize 由 ThemedText type="titleM" 设置
        // fontWeight 由 ThemedText type="titleM" 设置
        textAlign: 'center',
        marginBottom: Layout.spacing.md,
    },
    subtitle: {
        fontSize: Layout.fontSize.lg,
        textAlign: 'center',
        marginBottom: Layout.spacing.xs,
        lineHeight: Layout.fontSize.lg * 1.4,
    },
    buttonContainer: {
        marginTop: Layout.spacing.xl,
        width: '100%',
        maxWidth: 400,
    },
    button: {
        paddingVertical: Layout.spacing.md + 2,
        borderRadius: Layout.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Layout.spacing.md,
        width: '100%',
        minHeight: Layout.buttonHeight,
    },
    buttonText: {
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.semibold,
    },
});
