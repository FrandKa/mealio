// app/(auth)/register-phone.tsx
import React, { useState, useRef, useEffect } from 'react';
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
    TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/constants/AuthContext'; // 注册成功后需要 signIn
import { API_BASE_URL } from '@/constants/Api';

const OTP_COUNTDOWN_SECONDS = 60;
const EFFECTIVE_OTP_LENGTH = 4; // 根据你的后端，OTP是4位

export default function RegisterPhoneScreen() {
    const router = useRouter();
    // 从上一个屏幕 (register-credentials.tsx) 获取 username 和 password
    const params = useLocalSearchParams<{ username?: string; password?: string }>();
    const colorScheme = useColorScheme() ?? 'light';
    const themedColors = Colors[colorScheme];
    const { signIn } = useAuth(); // 注册成功后自动登录

    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false); // 控制主要“注册”按钮的加载状态
    const [isSendingOtp, setIsSendingOtp] = useState(false); // 控制“获取验证码”按钮的加载状态
    const [countdown, setCountdown] = useState(0);

    const otpInputRef = useRef<TextInput>(null);
    let countdownInterval = useRef<NodeJS.Timeout | null>(null);

    // 从参数中获取用户名和密码
    const usernameFromParams = params.username;
    const passwordFromParams = params.password;

    useEffect(() => {
        // 确保从上一步获取到了用户名或密码
        if (!usernameFromParams || !passwordFromParams) {
            Alert.alert("错误", "注册信息不完整，请返回上一步填写用户名和密码。", [
                { text: "好的", onPress: () => router.back() } // 或 router.replace('/(auth)/register-credentials')
            ]);
        }
    }, [usernameFromParams, passwordFromParams, router]);

    // 清理倒计时 interval
    useEffect(() => {
        return () => {
            if (countdownInterval.current) {
                clearInterval(countdownInterval.current);
            }
        };
    }, []);

    // 处理倒计时逻辑
    useEffect(() => {
        if (countdown > 0) {
            countdownInterval.current = setInterval(() => {
                setCountdown(prev => Math.max(0, prev - 1));
            }, 1000);
        } else if (countdown === 0 && countdownInterval.current) {
            clearInterval(countdownInterval.current);
            countdownInterval.current = null;
        }
        return () => {
            if (countdownInterval.current) clearInterval(countdownInterval.current);
        };
    }, [countdown]);

    const handleSendOtpForRegister = async () => {
        if (!phone.trim()) {
            Alert.alert('输入错误', '请输入手机号码。');
            return;
        }
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone.trim())) {
            Alert.alert('输入错误', '请输入有效的手机号码。');
            return;
        }
        Keyboard.dismiss();
        setIsSendingOtp(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim(), purpose: 'register' }), // purpose 是 'register'
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `发送验证码失败 (状态码: ${response.status})`);
            }
            Alert.alert('成功', data.message || '验证码已发送 (模拟)，请查收。');
            setCountdown(OTP_COUNTDOWN_SECONDS);
            otpInputRef.current?.focus();
        } catch (error: any) {
            Alert.alert('发送失败', error.message || '发送验证码时发生错误。');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleRegister = async () => {
        if (!usernameFromParams || !passwordFromParams) {
            Alert.alert("错误", "注册信息不完整，请返回填写用户名和密码。");
            return;
        }
        if (!phone.trim() || !otp.trim()) {
            Alert.alert('输入错误', '请输入手机号和验证码。');
            return;
        }
        if (otp.trim().length !== EFFECTIVE_OTP_LENGTH) {
            Alert.alert('输入错误', `请输入有效的${EFFECTIVE_OTP_LENGTH}位验证码。`);
            return;
        }

        Keyboard.dismiss();
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register-with-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: usernameFromParams,
                    password: passwordFromParams,
                    phone: phone.trim(),
                    otp: otp.trim(),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `注册失败 (状态码: ${response.status})`);
            }
            // 注册成功，调用 AuthContext 的 signIn 使新用户自动登录
            await signIn({
                accessToken: data.accessToken,
                user: data.user,
            });
            // 导航到成功页面或主页（由 AuthContext 和 _layout.tsx 自动处理重定向到 (tabs)）
            // 你也可以在这里显式导航到一个注册成功提示页面，然后再由 AuthContext 重定向
            // 例如: router.replace('/(auth)/register-success');
            // 但通常 signIn 后，根布局的 useEffect 就会处理重定向到主应用
            Alert.alert('注册成功', data.message || '欢迎加入 Mealio！');

        } catch (error: any) {
            Alert.alert('注册失败', error.message || '发生未知错误，请稍后再试。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
                contentContainerStyle={[styles.scrollContainer, { backgroundColor: themedColors.background }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                alwaysBounceVertical={false}
            >
                <View style={styles.container}>
                    <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.headerContent}>
                        <ThemedText type="titleL" style={[styles.title, { color: themedColors.text }]}>
                            验证手机号以完成注册
                        </ThemedText>
                        <ThemedText style={[styles.subtitle, { color: themedColors.textSubtle }]}>
                            我们将发送验证码到您的手机。
                        </ThemedText>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formContainer}>
                        {/* 手机号输入 */}
                        <View style={[styles.inputWrapper, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor }]}>
                            <Ionicons name="call-outline" size={20} color={themedColors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: themedColors.text }]}
                                placeholder="请输入您的手机号码"
                                placeholderTextColor={themedColors.textSubtle}
                                value={phone}
                                onChangeText={setPhone}
                                autoCapitalize="none"
                                keyboardType="phone-pad"
                                returnKeyType="next"
                                onSubmitEditing={() => otpInputRef.current?.focus()}
                                blurOnSubmit={false}
                                editable={countdown === 0} // 倒计时期间不可编辑手机号
                            />
                        </View>

                        {/* 验证码输入 */}
                        <View style={[styles.inputWrapper, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor }]}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={themedColors.icon} style={styles.inputIcon} />
                            <TextInput
                                ref={otpInputRef}
                                style={[styles.input, { color: themedColors.text }]}
                                placeholder="请输入短信验证码"
                                placeholderTextColor={themedColors.textSubtle}
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                returnKeyType="done"
                                maxLength={EFFECTIVE_OTP_LENGTH}
                                onSubmitEditing={handleRegister} // 提交以注册
                            />
                        </View>

                        {/* 获取验证码按钮 - 位于验证码输入框右下角 */}
                        <View style={styles.getOtpButtonContainer}>
                            <TouchableOpacity
                                style={[styles.otpButtonLink]}
                                onPress={handleSendOtpForRegister}
                                disabled={countdown > 0 || isSendingOtp}
                            >
                                <Text style={[styles.otpButtonLinkText, { color: countdown > 0 || isSendingOtp ? themedColors.textSubtle : themedColors.tint }]}>
                                    {isSendingOtp ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(600).duration(1000)} style={styles.buttonSection}>
                        <TouchableOpacity onPress={handleRegister} disabled={isLoading || isSendingOtp}>
                            <LinearGradient
                                colors={isLoading || isSendingOtp ? [themedColors.tint, themedColors.tint] : [themedColors.primary, themedColors.tint]}
                                style={styles.button}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={themedColors.authPrimaryButtonText} />
                                ) : (
                                    <Text style={[styles.buttonText, { color: themedColors.authPrimaryButtonText }]}>注册</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(800).duration(1000)} style={styles.footer}>
                        <Text style={[styles.footerText, { color: themedColors.textSubtle }]}>已经有账户? </Text>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                            <Text style={[styles.footerLink, { color: themedColors.tint }]}>立即登录</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    <View style={{height: Layout.spacing.md}} />
                </View>
            </ScrollView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: Layout.spacing.lg + Layout.spacing.sm,
        paddingVertical: Layout.spacing.xl,
        justifyContent: 'center',
    },
    headerContent: {
        alignItems: 'center',
        marginBottom: Layout.spacing.xl,
    },
    title: {
        textAlign: 'center',
        marginBottom: Layout.spacing.sm,
    },
    subtitle: {
        fontSize: Layout.fontSize.md,
        textAlign: 'center',
        lineHeight: Layout.fontSize.md * 1.5,
        maxWidth: '90%',
    },
    formContainer: {
        width: '100%',
        marginBottom: Layout.spacing.md,
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
    getOtpButtonContainer: {
        alignSelf: 'flex-end',
        marginTop: -Layout.spacing.sm,
        marginBottom: Layout.spacing.lg,
    },
    otpButtonLink: {
        paddingVertical: Layout.spacing.xs,
        paddingHorizontal: Layout.spacing.sm,
    },
    otpButtonLinkText: {
        fontSize: Layout.fontSize.sm,
        fontWeight: Layout.fontWeight.medium,
    },
    buttonSection: {
        width: '100%',
        marginTop: Layout.spacing.md,
    },
    button: {
        paddingVertical: Layout.spacing.md,
        borderRadius: Layout.borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: Layout.buttonHeight,
    },
    buttonText: {
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.semibold,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Layout.spacing.xl,
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
