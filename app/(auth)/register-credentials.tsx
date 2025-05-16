// app/(auth)/register-credentials.tsx
import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
// useAuth 和 API_BASE_URL 在这个纯输入凭证的步骤中可能不需要

export default function RegisterCredentialsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const themedColors = Colors[colorScheme];

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Refs for focusing next input
    const passwordInputRef = useRef<TextInput>(null);
    const confirmPasswordInputRef = useRef<TextInput>(null);

    const handleNextStep = () => {
        Keyboard.dismiss(); // 先收起键盘

        // 1. 非空校验
        if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert('输入错误', '所有字段均为必填项。');
            return;
        }
        // 2. 用户名长度校验 (可选，后端也有)
        if (username.trim().length < 3) {
            Alert.alert('输入错误', '用户名长度不能少于3个字符。');
            return;
        }
        // 3. 密码长度校验
        if (password.length < 6) {
            Alert.alert('输入错误', '密码必须至少包含6个字符。');
            return;
        }
        // 4. 两次密码一致性校验
        if (password !== confirmPassword) {
            Alert.alert('输入错误', '两次输入的密码不一致。');
            return;
        }

        // 所有校验通过，导航到下一步（例如，手机号输入页面）
        // 并将用户名和密码作为参数传递
        router.push({
            pathname: '/(auth)/register-phone', // 假设下一个页面是 register-phone.tsx
            params: {
                username: username.trim(),
                password: password, // 密码不 trim，保留用户输入的空格（如果他们想的话）
            },
        });
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
                            创建您的账户
                        </ThemedText>
                        <ThemedText style={[styles.subtitle, { color: themedColors.textSubtle }]}>
                            让我们开始设置您的 Mealio 账户。
                        </ThemedText>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formContainer}>
                        {/* 用户名输入 */}
                        <View style={[styles.inputWrapper, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor }]}>
                            <Ionicons name="person-circle-outline" size={22} color={themedColors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: themedColors.text }]}
                                placeholder="用户名"
                                placeholderTextColor={themedColors.textSubtle}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                returnKeyType="next"
                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                                blurOnSubmit={false}
                            />
                        </View>

                        {/* 密码输入 */}
                        <View style={[styles.inputWrapper, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor }]}>
                            <Ionicons name="lock-closed-outline" size={22} color={themedColors.icon} style={styles.inputIcon} />
                            <TextInput
                                ref={passwordInputRef}
                                style={[styles.input, { color: themedColors.text }]}
                                placeholder="密码 (至少6位)"
                                placeholderTextColor={themedColors.textSubtle}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                returnKeyType="next"
                                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                                blurOnSubmit={false}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconContainer}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color={themedColors.icon} />
                            </TouchableOpacity>
                        </View>

                        {/* 确认密码输入 */}
                        <View style={[styles.inputWrapper, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor }]}>
                            <Ionicons name="lock-closed-outline" size={22} color={themedColors.icon} style={styles.inputIcon} />
                            <TextInput
                                ref={confirmPasswordInputRef}
                                style={[styles.input, { color: themedColors.text }]}
                                placeholder="确认密码"
                                placeholderTextColor={themedColors.textSubtle}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                returnKeyType="done" // 最后一个输入框
                                onSubmitEditing={handleNextStep} // 按下后尝试进入下一步
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIconContainer}>
                                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={24} color={themedColors.icon} />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(600).duration(1000)} style={styles.buttonSection}>
                        <TouchableOpacity onPress={handleNextStep}>
                            <LinearGradient
                                colors={[themedColors.primary, themedColors.tint]}
                                style={styles.button}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={[styles.buttonText, { color: themedColors.authPrimaryButtonText }]}>下一步</Text>
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
        marginBottom: Layout.spacing.xl, // 表单和按钮之间的间距
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
    buttonSection: {
        width: '100%',
        // marginTop: Layout.spacing.lg, // 已在 formContainer.marginBottom 中处理
    },
    button: {
        paddingVertical: Layout.spacing.md,
        borderRadius: Layout.borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: Layout.buttonHeight,
        // marginBottom: Layout.spacing.md, // 如果只有一个按钮，底部间距由 footer 的 marginTop 控制
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
