// app/(auth)/verify-otp.tsx
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
import { useRouter } from 'expo-router'; // useLocalSearchParams 不再需要，因为 purpose 是固定的
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/constants/AuthContext';
import { API_BASE_URL } from '@/constants/Api';

const OTP_COUNTDOWN_SECONDS = 60;
const EFFECTIVE_OTP_LENGTH = 4; // 根据你的后端，OTP是4位

export default function VerifyOtpScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const themedColors = Colors[colorScheme];
    const { signIn } = useAuth();

    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const otpInputRef = useRef<TextInput>(null);
    let countdownInterval = useRef<NodeJS.Timeout | null>(null);

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


    const handleSendOtp = async () => {
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
            // "purpose" 硬编码为 "login"
            const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim(), purpose: 'login' }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `发送验证码失败 (状态码: ${response.status})`);
            }
            Alert.alert('成功', data.message || '验证码已发送 (模拟)。');
            setCountdown(OTP_COUNTDOWN_SECONDS);
            otpInputRef.current?.focus();
        } catch (error: any) {
            Alert.alert('发送失败', error.message || '发送验证码时发生错误。');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleLoginWithOtp = async () => {
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
            const response = await fetch(`${API_BASE_URL}/auth/login-with-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `登录失败 (状态码: ${response.status})`);
            }
            await signIn({ accessToken: data.accessToken, user: data.user });
        } catch (error: any) {
            Alert.alert('登录失败', error.message || '验证码登录时发生错误。');
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToPasswordLogin = () => {
        Keyboard.dismiss();
        router.replace('/(auth)/login');
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
                            手机验证码登录
                        </ThemedText>
                        <ThemedText style={[styles.subtitle, { color: themedColors.textSubtle }]}>
                            请输入您的手机号以接收验证码。
                        </ThemedText>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formContainer}>
                        {/* 手机号输入 */}
                        <View style={[styles.inputWrapper, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor }]}>
                            <Ionicons name="call-outline" size={20} color={themedColors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: themedColors.text }]}
                                placeholder="手机号码"
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
                                placeholder="验证码"
                                placeholderTextColor={themedColors.textSubtle}
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                returnKeyType="done"
                                maxLength={EFFECTIVE_OTP_LENGTH}
                                onSubmitEditing={handleLoginWithOtp} // 提交OTP以登录
                            />
                        </View>

                        {/* 获取验证码按钮 - 位于验证码输入框右下角 */}
                        <View style={styles.getOtpButtonContainer}>
                            <TouchableOpacity
                                style={[styles.otpButtonLink]}
                                onPress={handleSendOtp}
                                disabled={countdown > 0 || isSendingOtp}
                            >
                                <Text style={[styles.otpButtonLinkText, { color: countdown > 0 || isSendingOtp ? themedColors.textSubtle : themedColors.tint }]}>
                                    {isSendingOtp ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(600).duration(1000)} style={styles.buttonSection}>
                        <TouchableOpacity onPress={handleLoginWithOtp} disabled={isLoading || isSendingOtp}>
                            <LinearGradient
                                colors={isLoading || isSendingOtp ? [themedColors.tint, themedColors.tint] : [themedColors.primary, themedColors.tint]}
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
                            onPress={navigateToPasswordLogin}
                            disabled={isLoading || isSendingOtp}
                        >
                            <Text style={[styles.switchLoginText, { color: themedColors.tint }]}>使用账号密码登录</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* 新增：还没有账户? 立即注册 */}
                    <Animated.View entering={FadeInUp.delay(800).duration(1000)} style={styles.footer}>
                        <Text style={[styles.footerText, { color: themedColors.textSubtle }]}>还没有账户? </Text>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/register-credentials')}>
                            <Text style={[styles.footerLink, { color: themedColors.tint }]}>立即注册</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    {/* 底部增加一些空白，避免内容太靠下 */}
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
    switchLoginText: {
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.medium,
    },
    // 页脚样式 (与 login.tsx 中的一致)
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Layout.spacing.xl, // 与上方按钮组的间距
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
