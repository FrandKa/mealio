// app/(app)/settings/edit-profile.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    Modal, Keyboard, TouchableWithoutFeedback, // 用于头像预览和性别选择
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, UserProfile } from '@/constants/AuthContext'; // 导入 UserProfile 类型
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/Api';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants'; // 用于状态栏高度
import Animated, {FadeInUp, ZoomIn, Easing, SlideInDown} from 'react-native-reanimated';

// 扩展 UserProfile 以包含本地编辑状态
interface EditableUserProfile extends Partial<UserProfile> {
    expectedPrice?: string; // 期望价格在输入时是字符串
}

const GENDER_OPTIONS = [
    { label: '男', value: '男', icon: 'male' as const },
    { label: '女', value: '女', icon: 'female' as const },
    { label: '保密', value: '保密', icon: 'help-circle-outline' as const },
];

export default function EditProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const themedColors = Colors[colorScheme];
    const { user: authUser, fetchUserProfile, updateUser, session } = useAuth();

    const [profile, setProfile] = useState<EditableUserProfile>({});
    const [initialProfileLoaded, setInitialProfileLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null); // 本地选择的图片 URI
    const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);
    const [genderModalVisible, setGenderModalVisible] = useState(false);


    // 加载当前用户信息
    useEffect(() => {
        const loadInitialProfile = async () => {
            setIsLoading(true);
            let currentUserData = authUser;
            if (!currentUserData || !currentUserData.nickname) { // 如果 context 中信息不全，重新获取
                currentUserData = await fetchUserProfile();
            }
            if (currentUserData) {
                setProfile({
                    nickname: currentUserData.nickname || '',
                    phone: currentUserData.phone || '', // 电话号码通常在此页面只读
                    gender: currentUserData.gender || '保密',
                    avatar: currentUserData.avatar,
                    expectedPrice: currentUserData.preferences?.expected_price?.toString() || '',
                });
                setSelectedImageUri(currentUserData.avatar || null); // 初始化选中的图片为当前头像
            }
            setInitialProfileLoaded(true);
            setIsLoading(false);
        };
        loadInitialProfile();
    }, [authUser, fetchUserProfile]);


    const handleInputChange = (field: keyof EditableUserProfile, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleSelectGender = (gender: string) => {
        setProfile(prev => ({ ...prev, gender }));
        setGenderModalVisible(false);
    };

    const pickImage = async (useCamera: boolean = false) => {
        let permissionResult;
        if (useCamera) {
            permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        } else {
            permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        }

        if (permissionResult.granted === false) {
            Alert.alert('权限不足', `需要${useCamera ? '相机' : '相册'}权限才能更改头像。请在设置中开启。`);
            return;
        }

        let pickerResult;
        if (useCamera) {
            pickerResult = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });
        } else {
            pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1], // 强制裁剪为1:1比例
                quality: 0.7,   // 压缩图片质量
            });
        }

        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
            setSelectedImageUri(pickerResult.assets[0].uri);
            // 可以在这里直接触发上传，或者等用户点“保存”时再一起处理
            // 为了更好的用户体验，选择图片后可以立即上传并预览
            await uploadAvatar(pickerResult.assets[0].uri);
        }
    };

    const uploadAvatar = async (uri: string) => {
        if (!session) {
            Alert.alert("错误", "用户未登录，无法上传头像。");
            return;
        }
        setIsUploadingAvatar(true);
        const localUri = uri;
        const filename = localUri.split('/').pop() || `avatar_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const formData = new FormData();
        // @ts-ignore FormData 在 React Native 中可以直接接受这种格式的对象
        formData.append('avatar_file', { uri: localUri, name: filename, type });

        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_AVATAR_UPLOAD}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session}`,
                    // 'Content-Type': 'multipart/form-data' // fetch 会自动设置
                },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '头像上传失败');
            }
            Alert.alert('成功', '头像已更新！');
            setProfile(prev => ({ ...prev, avatar: data.avatarUrl }));
            await updateUser({ avatar: data.avatarUrl }); // 更新 AuthContext 中的用户头像
        } catch (error: any) {
            Alert.alert('上传失败', error.message || '头像上传过程中发生错误。');
            setSelectedImageUri(profile.avatar || null); // 上传失败，恢复为旧头像
        } finally {
            setIsUploadingAvatar(false);
        }
    };


    const handleSaveChanges = async () => {
        if (!session || !authUser) {
            Alert.alert("错误", "用户未登录，无法保存更改。");
            return;
        }
        Keyboard.dismiss();
        setIsLoading(true);

        const payload: any = {
            nickname: profile.nickname?.trim() || authUser.nickname, // 如果为空则使用旧的
            gender: profile.gender || authUser.gender,
        };
        if (profile.expectedPrice && !isNaN(parseFloat(profile.expectedPrice))) {
            payload.preferences = {
                expected_price: parseFloat(profile.expectedPrice)
            };
        } else if (authUser.preferences?.expected_price) { // 如果输入无效或为空，保留旧的
            payload.preferences = { expected_price: authUser.preferences.expected_price };
        }

        // 电话号码不在此处更新，根据后端逻辑

        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '更新个人信息失败');
            }
            Alert.alert('成功', '个人信息已更新！');
            // 更新 AuthContext 中的用户信息
            await updateUser({
                nickname: data.data?.nickname || payload.nickname,
                gender: data.data?.gender || payload.gender,
                preferences: data.data?.preferences || payload.preferences,
                // avatar 已经在 uploadAvatar 中更新
            });
            router.back(); // 保存成功后返回上一页
        } catch (error: any) {
            Alert.alert('保存失败', error.message || '更新过程中发生错误。');
        } finally {
            setIsLoading(false);
        }
    };

    if (!initialProfileLoaded || (isLoading && !isUploadingAvatar && !profile.nickname)) { // 初始加载时显示
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themedColors.tint} />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.outerContainer, { backgroundColor: themedColors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled"
            >
                {/* 头像区域 */}
                <Animated.View entering={ZoomIn.duration(500).delay(200)} style={styles.avatarSection}>
                    <TouchableOpacity onPress={() => {setSelectedImageUri(prev => prev || profile.avatar || null); setAvatarPreviewVisible(true)}} disabled={!selectedImageUri && !profile.avatar}>
                        <Image
                            source={selectedImageUri ? { uri: selectedImageUri } : (profile.avatar)}// 你需要一个默认头像图片
                            style={styles.avatarImage}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editAvatarButton} onPress={() => {
                        Alert.alert("选择图片来源", "", [
                            { text: "从相册选择", onPress: () => pickImage(false) },
                            { text: "拍照", onPress: () => pickImage(true) },
                            { text: "取消", style: "cancel" }
                        ]);
                    }}>
                        <View style={[styles.editAvatarIconContainer, {backgroundColor: themedColors.tintOpacified || 'rgba(109, 40, 217, 0.7)'}]}>
                            <Ionicons name="camera-outline" size={20} color={Colors.common.white} />
                        </View>
                    </TouchableOpacity>
                    {isUploadingAvatar && <ActivityIndicator size="small" color={themedColors.tint} style={styles.avatarLoadingIndicator}/>}
                </Animated.View>

                {/* 表单区域 */}
                <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.formSection}>
                    {/* 昵称 */}
                    <View style={styles.inputRow}>
                        <Ionicons name="happy-outline" size={24} color={themedColors.textSubtle} style={styles.inputLabelIcon} />
                        <ThemedText style={styles.inputLabel}>昵称</ThemedText>
                    </View>
                    <TextInput
                        style={[styles.input, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor, color: themedColors.text }]}
                        value={profile.nickname}
                        onChangeText={(text) => handleInputChange('nickname', text)}
                        placeholder="请输入您的昵称"
                        placeholderTextColor={themedColors.textSubtle}
                    />

                    {/* 电话 (只读) */}
                    <View style={styles.inputRow}>
                        <Ionicons name="call-outline" size={24} color={themedColors.textSubtle} style={styles.inputLabelIcon} />
                        <ThemedText style={styles.inputLabel}>电话</ThemedText>
                    </View>
                    <TextInput
                        style={[styles.input, styles.readOnlyInput, { backgroundColor: themedColors.placeholderBg, borderColor: themedColors.borderColor, color: themedColors.textSubtle }]}
                        value={profile.phone}
                        editable={false} // 电话号码通常不允许直接修改
                    />

                    {/* 性别 */}
                    <View style={styles.inputRow}>
                        <Ionicons name="transgender-outline" size={24} color={themedColors.textSubtle} style={styles.inputLabelIcon} />
                        <ThemedText style={styles.inputLabel}>性别</ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[styles.input, styles.pickerInput, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor }]}
                        onPress={() => setGenderModalVisible(true)}
                    >
                        <ThemedText style={{color: profile.gender ? themedColors.text : themedColors.textSubtle}}>
                            {profile.gender || '请选择性别'}
                        </ThemedText>
                        <Ionicons name="chevron-down" size={20} color={themedColors.textSubtle} />
                    </TouchableOpacity>


                    {/* 期望价格 */}
                    <View style={styles.inputRow}>
                        <MaterialCommunityIcons name="cash-multiple" size={24} color={themedColors.textSubtle} style={styles.inputLabelIcon} />
                        <ThemedText style={styles.inputLabel}>期望人均价格 (¥)</ThemedText>
                    </View>
                    <TextInput
                        style={[styles.input, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor, color: themedColors.text }]}
                        value={profile.expectedPrice}
                        onChangeText={(text) => handleInputChange('expectedPrice', text)}
                        placeholder="例如: 50"
                        placeholderTextColor={themedColors.textSubtle}
                        keyboardType="numeric"
                    />

                </Animated.View>

                {/* 保存按钮 */}
                <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.saveButtonContainer}>
                    <TouchableOpacity onPress={handleSaveChanges} disabled={isLoading || isUploadingAvatar}>
                        <LinearGradient
                            colors={isLoading || isUploadingAvatar ? [themedColors.tintOpacified || themedColors.tint, themedColors.tintOpacified || themedColors.tint] : [themedColors.primary, themedColors.tint]}
                            style={styles.saveButton}
                        >
                            {isLoading || isUploadingAvatar ? (
                                <ActivityIndicator color={Colors.common.white} />
                            ) : (
                                <Text style={styles.saveButtonText}>保存更改</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            {/* 头像预览模态框 */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={avatarPreviewVisible}
                onRequestClose={() => setAvatarPreviewVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setAvatarPreviewVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <Animated.View entering={ZoomIn.duration(300)} style={styles.avatarPreviewContainer}>
                                {selectedImageUri && <Image source={{uri: selectedImageUri}} style={styles.avatarPreviewImage} resizeMode="contain"/>}
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* 性别选择模态框 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={genderModalVisible}
                onRequestClose={() => setGenderModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setGenderModalVisible(false)}>
                    <View style={[styles.modalOverlay, styles.genderModalOverlay]}>
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <Animated.View entering={SlideInDown.duration(300)} style={[styles.genderModalContent, { backgroundColor: themedColors.cardBg }]}>
                                <ThemedText type="titleS" style={styles.genderModalTitle}>选择性别</ThemedText>
                                {GENDER_OPTIONS.map(option => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={styles.genderOption}
                                        onPress={() => handleSelectGender(option.value)}
                                    >
                                        <Ionicons name={option.icon} size={24} color={profile.gender === option.value ? themedColors.tint : themedColors.textSubtle} style={{marginRight: Layout.spacing.md}}/>
                                        <ThemedText style={[styles.genderOptionText, {color: profile.gender === option.value ? themedColors.tint : themedColors.text}]}>{option.label}</ThemedText>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity style={styles.genderCancelButton} onPress={() => setGenderModalVisible(false)}>
                                    <Text style={[styles.genderCancelButtonText, {color: themedColors.textSubtle}]}>取消</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </ThemedView>
    );
}

// 在 Colors.ts 中为你主题的 light 和 dark 对象添加 tintOpacified
// light: { ..., tintOpacified: 'rgba(109, 40, 217, 0.7)', ... }
// dark: { ..., tintOpacified: 'rgba(167, 139, 250, 0.7)', ... }

const styles = StyleSheet.create({
    outerContainer: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContentContainer: {
        paddingTop: (Platform.OS === 'android' ? Constants.statusBarHeight : 0) + Layout.spacing.xxl + 21, // 安卓状态栏适配
        paddingBottom: Layout.spacing.xxl,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: Layout.spacing.lg,
        position: 'relative', // 为了编辑按钮的绝对定位
    },
    avatarImage: {
        width: Layout.screen.width * 0.35,
        height: Layout.screen.width * 0.35,
        borderRadius: (Layout.screen.width * 0.35) / 2,
        backgroundColor: Colors.light.placeholderBg, // 占位符背景
        borderWidth: 3,
        borderColor: Colors.light.cardBg, // 与背景有对比的边框
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: Layout.spacing.xs,
        right: Layout.screen.width / 2 - (Layout.screen.width * 0.35 / 2) + Layout.spacing.xs, // 大致在头像右下角
        padding: Layout.spacing.xs,
        borderRadius: Layout.borderRadius.circle,
    },
    editAvatarIconContainer: {
        padding: Layout.spacing.sm -2,
        borderRadius: Layout.borderRadius.circle,
        ...Layout.shadow.sm,
        elevation:3,
    },
    avatarLoadingIndicator: {
        position: 'absolute',
        bottom: Layout.spacing.md + 5, // 根据 editAvatarButton 调整
    },
    formSection: {
        paddingHorizontal: Layout.spacing.page,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Layout.spacing.lg,
        marginBottom: Layout.spacing.xs,
    },
    inputLabelIcon: {
        marginRight: Layout.spacing.sm,
    },
    inputLabel: {
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.semibold,
    },
    input: {
        height: Layout.inputHeight + Layout.spacing.xs,
        borderRadius: Layout.borderRadius.md,
        paddingHorizontal: Layout.spacing.md,
        fontSize: Layout.fontSize.md,
        borderWidth: 1,
        // backgroundColor, borderColor, color 在组件中设置
    },
    readOnlyInput: {
        // 特殊样式用于只读输入框
    },
    pickerInput: { // 性别选择器的样式，使其看起来像输入框
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    saveButtonContainer: {
        paddingHorizontal: Layout.spacing.page,
        marginTop: Layout.spacing.xl,
    },
    saveButton: {
        paddingVertical: Layout.spacing.md + 2,
        borderRadius: Layout.borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: Layout.buttonHeight,
    },
    saveButtonText: {
        color: Colors.common.white,
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.semibold,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    avatarPreviewContainer: {
        padding: Layout.spacing.sm,
        backgroundColor: Colors.light.cardBg, // 或者 themedColors.cardBg
        borderRadius: Layout.borderRadius.md,
        ...Layout.shadow.lg,
        elevation: 10,
    },
    avatarPreviewImage: {
        width: Layout.screen.width * 0.8,
        height: Layout.screen.width * 0.8,
        borderRadius: Layout.borderRadius.sm, // 预览图可以不用是圆的
    },
    genderModalOverlay: {
        justifyContent: 'flex-end', // 使模态框从底部出现
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    genderModalContent: {
        width: '100%',
        paddingTop: Layout.spacing.lg,
        paddingBottom: (Platform.OS === 'ios' ? Layout.spacing.lg : Layout.spacing.md) + Layout.spacing.md, // iOS底部安全区
        borderTopLeftRadius: Layout.borderRadius.xl,
        borderTopRightRadius: Layout.borderRadius.xl,
        alignItems: 'center',
    },
    genderModalTitle: {
        marginBottom: Layout.spacing.lg,
    },
    genderOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Layout.spacing.md,
        width: '90%',
        borderBottomWidth: StyleSheet.hairlineWidth,
        // borderColor由themedColors.borderColor设置
    },
    genderOptionText: {
        fontSize: Layout.fontSize.lg,
    },
    genderCancelButton: {
        marginTop: Layout.spacing.lg,
        padding: Layout.spacing.md,
    },
    genderCancelButtonText: {
        fontSize: Layout.fontSize.lg,
    }
});
