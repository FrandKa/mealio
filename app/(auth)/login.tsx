// app/(auth)/login.tsx
import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback, // 新增：用于点击空白处收起键盘
} from 'react-native';
import { useRouter } from 'expo-router'; // Added based on usage and "其他 imports 保持不变"
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/constants/AuthContext';
import { API_BASE_URL } from '@/constants/Api';


export default function LoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const themedColors = Colors[colorScheme];
    const { signIn } = useAuth();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const passwordInputRef = useRef<TextInput>(null);

    const handleLogin = async () => {
        if (!identifier.trim() || !password.trim()) {
            Alert.alert('输入错误', '请输入用户名/手机号和密码。');
            return;
        }
        Keyboard.dismiss(); // 点击登录时收起键盘
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ identifier: identifier.trim(), password: password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `登录失败 (状态码: ${response.status})`);
            }
            await signIn({ accessToken: data.accessToken, user: data.user });
        } catch (error: any) {
            Alert.alert('登录失败', error.message || '发生未知错误，请稍后再试。');
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToOtpLogin = () => {
        Keyboard.dismiss();
        router.push({
            pathname: '/(auth)/verify-otp',
            params: { purpose: 'login' }
        });
        // Alert.alert("提示", "手机验证码登录功能正在建设中。"); // 可以暂时移除或保留
    };
    return (
        // 使用 TouchableWithoutFeedback 包裹 ScrollView，允许点击空白处收起键盘
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
                contentContainerStyle={[styles.scrollContainer, { backgroundColor: themedColors.background }]}
                keyboardShouldPersistTaps="handled" // 允许点击 ScrollView 内的按钮等元素而不立即收起键盘
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical={false} // 避免不必要的回弹
            >
                <View style={styles.container}>
                    <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.headerContent}>
                        <ThemedText type="titleL" style={[styles.title, { color: themedColors.text }]}>
                            欢迎回来!
                        </ThemedText>
                        <ThemedText style={[styles.subtitle, { color: themedColors.textSubtle }]}>
                            登录以继续您的旅程。
                        </ThemedText>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formContainer}>
                        <View style={[styles.inputWrapper, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor }]}>
                            <Ionicons name="person-outline" size={20} color={themedColors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: themedColors.text }]}
                                placeholder="用户名或手机号"
                                placeholderTextColor={themedColors.textSubtle}
                                value={identifier}
                                onChangeText={setIdentifier}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                returnKeyType="next"
                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                                blurOnSubmit={false}
                            />
                        </View>

                        <View style={[styles.inputWrapper, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={themedColors.icon} style={styles.inputIcon} />
                            <TextInput
                                ref={passwordInputRef}
                                style={[styles.input, { color: themedColors.text }]}
                                placeholder="密码"
                                placeholderTextColor={themedColors.textSubtle}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconContainer}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color={themedColors.icon} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => Alert.alert("提示", "忘记密码功能开发中。")}>
                            <Text style={[styles.forgotPasswordText, { color: themedColors.textSubtle }]}>忘记密码?</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(600).duration(1000)} style={styles.buttonSection}>
                        <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
                            <LinearGradient
                                colors={isLoading ? [themedColors.tint, themedColors.tint] : [themedColors.primary, themedColors.tint]}
                                style={styles.button}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={themedColors.authPrimaryButtonText} />
                                ) : (
                                    <Text style={[styles.buttonText, { color: themedColors.authPrimaryButtonText }]}>登录</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButtonAction}
                            onPress={navigateToOtpLogin}
                            disabled={isLoading}
                        >
                            <Text style={[styles.otpLoginText, { color: themedColors.tint }]}>使用手机验证码登录</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(800).duration(1000)} style={styles.footer}>
                        <Text style={[styles.footerText, { color: themedColors.textSubtle }]}>还没有账户? </Text>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/register-credentials')}>
                            <Text style={[styles.footerLink, { color: themedColors.tint }]}>立即注册</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        // backgroundColor 由 themedColors.background 在组件中动态设置
    },
    container: {
        flex: 1,
        paddingHorizontal: Layout.spacing.lg + Layout.spacing.sm,
        // paddingTop 和 paddingBottom 可以根据需要调整，或者让 flexGrow 和 justifyContent 决定
        // 如果内容总是填满屏幕或需要滚动，则可以移除 paddingTop/Bottom，依赖 ScrollView 的内边距
        paddingVertical: Layout.spacing.xl, // 保留一些垂直内边距
        justifyContent: 'center',
    },
    headerContent: {
        alignItems: 'center',
        marginBottom: Layout.spacing.xxl,
    },
    title: {
        textAlign: 'center',
        marginBottom: Layout.spacing.sm,
    },
    subtitle: {
        fontSize: Layout.fontSize.md,
        textAlign: 'center',
        lineHeight: Layout.fontSize.md * 1.5,
        maxWidth: '80%',
    },
    formContainer: {
        width: '100%',
        marginBottom: Layout.spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius.lg,
        borderWidth: 1,
        marginBottom: Layout.spacing.lg,
        paddingHorizontal: Layout.spacing.md,
        height: Layout.inputHeight + Layout.spacing.xs,
    },
    inputIcon: {
        marginRight: Layout.spacing.sm,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: Layout.fontSize.md,
    },
    eyeIconContainer: {
        padding: Layout.spacing.sm,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        paddingVertical: Layout.spacing.sm,
    },
    forgotPasswordText: {
        fontSize: Layout.fontSize.sm,
    },
    buttonSection: {
        width: '100%',
        marginTop: Layout.spacing.lg,
    },
    button: {
        paddingVertical: Layout.spacing.md,
        borderRadius: Layout.borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: Layout.buttonHeight,
        marginBottom: Layout.spacing.md,
    },
    buttonText: {
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.semibold,
    },
    secondaryButtonAction: {
        paddingVertical: Layout.spacing.sm,
        alignItems: 'center',
    },
    otpLoginText: {
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.medium,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Layout.spacing.xl,
        // paddingBottom: Layout.spacing.sm, // ScrollView 会处理底部空间
    },
    footerText: {
        fontSize: Layout.fontSize.md,
    },
    footerLink: {
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.bold,
        marginLeft: Layout.spacing.xs,
    },
});
