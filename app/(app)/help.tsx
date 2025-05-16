// app/(app)/settings/help.tsx
import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal, // 用于弹出反馈卡片
    Platform,
    KeyboardAvoidingView, // 用于处理键盘与模态框的交互
    TouchableWithoutFeedback, // 用于点击模态框外部关闭
    Keyboard,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import Animated, {FadeInUp, FadeInDown, ZoomIn, Easing, FadeIn} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient'; // 用于按钮
import { BlurView } from 'expo-blur';
import {platform} from "node:os"; // Expo 提供的 BlurView

// 示例 FAQ 数据
const faqData = [
    {
        id: '1',
        question: '如何搜索附近的餐厅？',
        answer: '在首页顶部的搜索栏输入您想查找的餐厅类型、菜系或关键词，或者直接浏览“附近的餐厅”列表。在“发现”页面，您可以通过地图直观地查找。',
    },
    {
        id: '2',
        question: '如何查看餐厅详情和评价？',
        answer: '点击任何餐厅列表项或地图上的标记，即可进入餐厅详情页面。在这里您可以看到餐厅的详细信息、用户评价、推荐菜品以及营业时间等。',
    },
    {
        id: '3',
        question: '如何进行筛选和排序？',
        answer: '在首页“附近的餐厅”区域，点击“筛选”按钮可以根据价格、距离、菜系等条件进行筛选。部分列表也支持排序功能。',
    },
    {
        id: '4',
        question: '如何收藏我喜欢的餐厅？',
        answer: '在餐厅列表项或详情页面，通常会有一个心形收藏按钮。点击即可收藏或取消收藏您喜欢的餐厅。您可以在“清单”页面查看所有收藏。 (注: 收藏功能在当前代码中可能尚未完全实现)',
    },
    {
        id: '5',
        question: '如果我遇到问题或有建议怎么办？',
        answer: '非常感谢您的反馈！请点击本页面下方的“反馈问题”按钮，详细描述您遇到的问题或提出的宝贵建议，我们会尽快处理。',
    },
];

export default function HelpScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const themedColors = Colors[colorScheme];

    const [modalVisible, setModalVisible] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    const handleToggleFaq = (id: string) => {
        setExpandedFaq(prevId => (prevId === id ? null : id));
    };

    const handleSubmitFeedback = () => {
        if (!feedbackText.trim()) {
            return;
        }
        console.log('Feedback submitted:', feedbackText);
        // 实际应用中，这里会调用 API 提交反馈
        setFeedbackText(''); // 清空输入框
        setModalVisible(false); // 关闭模态框
    };

    return (
        <ThemedView style={[styles.outerContainer, { backgroundColor: themedColors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContentContainer}
            >
                <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.headerSection}>
                    <Ionicons name="help-buoy-outline" size={Layout.fontSize.display + 10} color={themedColors.tint} />
                    <ThemedText type="titleL" style={[styles.pageTitle, { marginTop: Layout.spacing.sm }]}>帮助与反馈</ThemedText>
                    <ThemedText style={[styles.pageSubtitle, { color: themedColors.textSubtle }]}>
                        我们在这里帮助您更好地使用 Mealio。
                    </ThemedText>
                </Animated.View>

                {/* FAQ 列表 */}
                <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.faqSection}>
                    <ThemedText type="titleM" style={styles.sectionTitle}>常见问题解答</ThemedText>
                    {faqData.map((item) => (
                        <View key={item.id} style={[styles.faqItem, { backgroundColor: themedColors.cardBg, borderColor: themedColors.borderColor }]}>
                            <TouchableOpacity
                                style={styles.faqQuestionContainer}
                                onPress={() => handleToggleFaq(item.id)}
                                activeOpacity={0.7}
                            >
                                <ThemedText style={styles.faqQuestionText}>{item.question}</ThemedText>
                                <Ionicons
                                    name={expandedFaq === item.id ? 'chevron-up-outline' : 'chevron-down-outline'}
                                    size={22}
                                    color={themedColors.textSubtle}
                                />
                            </TouchableOpacity>
                            {expandedFaq === item.id && (
                                <Animated.View entering={FadeIn.duration(300)} style={styles.faqAnswerContainer}>
                                    <ThemedText style={[styles.faqAnswerText, {color: themedColors.textSubtle}]}>{item.answer}</ThemedText>
                                </Animated.View>
                            )}
                        </View>
                    ))}
                </Animated.View>

                {/* 反馈按钮 */}
                <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.feedbackButtonContainer}>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <LinearGradient
                            colors={[themedColors.primary, themedColors.tint]}
                            style={styles.feedbackButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.common.white} style={{marginRight: Layout.spacing.sm}}/>
                            <Text style={styles.feedbackButtonText}>反馈问题</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            {/* 反馈模态框 */}
            <Modal
                animationType="fade" // 'fade' 或 'slide'
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setModalVisible(false); }}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                            {/* 使用 Expo BlurView 实现毛玻璃效果 */}
                            <BlurView
                                intensity={Platform.OS === 'ios' ? 90 : 100} // 调整模糊强度
                                tint={colorScheme} // 'light', 'dark', 'default'
                                style={styles.modalContentWrapper}
                            >
                                <Animated.View
                                    entering={ZoomIn.duration(400).easing(Easing.out(Easing.exp))}
                                    style={[styles.modalView, { backgroundColor: '#FFF' }]} // BlurView 自己有背景
                                >
                                    <ThemedText type="titleM" style={[styles.modalTitle, {color: themedColors.text}]}>提交您的反馈</ThemedText>
                                    <TextInput
                                        style={[styles.feedbackInput, {
                                            borderColor: themedColors.borderColor,
                                            color: themedColors.text,
                                            backgroundColor: themedColors.inputBackground || 'rgba(255,255,255,0.1)' // 定义一个输入框背景色
                                        }]}
                                        placeholder="请详细描述您遇到的问题或建议..."
                                        placeholderTextColor={themedColors.textSubtle}
                                        multiline={true}
                                        numberOfLines={6}
                                        value={feedbackText}
                                        onChangeText={setFeedbackText}
                                        textAlignVertical="top" // Android上使文字从顶部开始
                                    />
                                    <TouchableOpacity onPress={handleSubmitFeedback} style={styles.submitFeedbackButtonWrapper}>
                                        <LinearGradient
                                            colors={[themedColors.primary, themedColors.tint]}
                                            style={styles.submitFeedbackButton}
                                        >
                                            <Text style={styles.feedbackButtonText}>提交</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
                                        <Ionicons name="close-circle" size={30} color={themedColors.textSubtle} />
                                    </TouchableOpacity>
                                </Animated.View>
                            </BlurView>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: Layout.spacing.page,
        paddingBottom: Layout.spacing.xxl,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: Layout.spacing.xl,
        paddingTop: Platform.OS === 'ios' ? Layout.spacing.md + 40 : Layout.spacing.md,
    },
    pageTitle: {
        textAlign: 'center',
    },
    pageSubtitle: {
        textAlign: 'center',
        marginTop: Layout.spacing.xs,
        fontSize: Layout.fontSize.md,
    },
    faqSection: {
        marginBottom: Layout.spacing.xl,
    },
    sectionTitle: {
        marginBottom: Layout.spacing.md,
        fontWeight: Layout.fontWeight.semibold,
    },
    faqItem: {
        borderRadius: Layout.borderRadius.md,
        marginBottom: Layout.spacing.md,
        borderWidth: 1,
        overflow: 'hidden', // 确保圆角生效
        ...Layout.shadow.sm,
        elevation: 2,
    },
    faqQuestionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Layout.spacing.md,
        paddingHorizontal: Layout.spacing.md,
    },
    faqQuestionText: {
        flex: 1, // 允许文本换行
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.medium,
        marginRight: Layout.spacing.sm,
    },
    faqAnswerContainer: {
        paddingHorizontal: Layout.spacing.md,
        paddingBottom: Layout.spacing.md,
        paddingTop: Layout.spacing.xs,
        borderTopWidth: StyleSheet.hairlineWidth,
        // borderColor 由 themedColors.borderColor 设置
    },
    faqAnswerText: {
        fontSize: Layout.fontSize.md,
        lineHeight: Layout.fontSize.md * 1.5,
    },
    feedbackButtonContainer: {
        alignItems: 'center',
        marginTop: Layout.spacing.lg,
    },
    feedbackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Layout.spacing.md,
        paddingHorizontal: Layout.spacing.xl,
        borderRadius: Layout.borderRadius.pill, // 药丸形状
        minWidth: '60%',
        ...Layout.shadow.md,
        elevation: 5,
    },
    feedbackButtonText: {
        color: Colors.common.white,
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.semibold,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // 半透明黑色背景
    },
    modalContentWrapper: { // For BlurView
        width: Layout.screen.height * 0.85, // 模态框宽度
        maxWidth: Layout.screen.width * 0.85,
        borderRadius: Layout.borderRadius.xl,
        overflow: 'hidden', // Important for BlurView borderRadius
    },
    modalView: {
        padding: Layout.spacing.lg,
        alignItems: 'center',
        // backgroundColor is transparent because BlurView provides the visual background
    },
    modalTitle: {
        marginBottom: Layout.spacing.lg,
        fontWeight: Layout.fontWeight.bold,
    },
    feedbackInput: {
        width: '100%',
        height: 120, // 多行输入框高度
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        fontSize: Layout.fontSize.md,
        marginBottom: Layout.spacing.lg,
        // backgroundColor, color, borderColor in component
    },
    submitFeedbackButtonWrapper: { // Wrapper for gradient button to apply shadow if needed
        width: '100%',
        borderRadius: Layout.borderRadius.lg, // Match gradient button
        ...Layout.shadow.sm, // Optional shadow for button
        elevation: 3,
    },
    submitFeedbackButton: { // Style for LinearGradient
        paddingVertical: Layout.spacing.md,
        borderRadius: Layout.borderRadius.lg,
        alignItems: 'center',
        width: '100%',
    },
    closeModalButton: {
        position: 'absolute',
        top: Layout.spacing.sm,
        right: Layout.spacing.sm,
        padding: Layout.spacing.xs,
    }
});
