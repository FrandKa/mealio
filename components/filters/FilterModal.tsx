// components/filters/FilterModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PriceFilterGroup, { PriceOption } from './PriceFilterGroup';
import DistanceFilterGroup, { DistanceOption } from './DistanceFilterGroup';
import CuisineFilterGroup, { CuisineOption } from './CuisineFilterGroup';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import Button from '@/components/ui/Button'; // 假设我们有一个自定义 Button, 否则用 TouchableOpacity

// 定义 FilterModal 接受的 props 和传出的 filters 结构
export type Filters = {
    priceValue: string; // e.g. "1-50", "custom", ""
    customMinPrice: string;
    customMaxPrice: string;
    distance: string | null; // km
    cuisine: string;
};

type FilterModalProps = {
    isVisible: boolean;
    onClose: () => void;
    onApplyFilters: (filters: Filters) => void;
    initialFilters: Filters;
    isLocationAvailable: boolean; // 从父组件传入
    onMoreCuisinesPress: () => void; // 用于打开更多菜系模态框
};

const FilterModal: React.FC<FilterModalProps> = ({
                                                     isVisible,
                                                     onClose,
                                                     onApplyFilters,
                                                     initialFilters,
                                                     isLocationAvailable,
                                                     onMoreCuisinesPress,
                                                 }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const commonColors = Colors.common;
    const insets = useSafeAreaInsets();

    // 内部状态管理筛选选项，初始化时从 props 获取
    const [currentFilters, setCurrentFilters] = useState<Filters>(initialFilters);

    useEffect(() => {
        // 当 initialFilters 变化时 (例如，外部清除了筛选条件)，同步内部状态
        setCurrentFilters(initialFilters);
    }, [initialFilters]);


    const handleApply = () => {
        // 可以在这里做一些校验，例如 minPrice <= maxPrice
        let finalFilters = { ...currentFilters };
        if (finalFilters.priceValue === 'custom') {
            const minP = parseFloat(finalFilters.customMinPrice);
            const maxP = parseFloat(finalFilters.customMaxPrice);
            if (!isNaN(minP) && !isNaN(maxP) && minP > maxP) {
                // 简单交换
                [finalFilters.customMinPrice, finalFilters.customMaxPrice] = [finalFilters.customMaxPrice, finalFilters.customMinPrice];
            }
        }
        onApplyFilters(finalFilters);
        onClose();
    };

    const updateFilter = (key: keyof Filters, value: any) => {
        setCurrentFilters(prev => ({ ...prev, [key]: value }));
    };

    // 当预设价格选项被选中时，清空自定义价格输入
    const handlePriceOptionSelect = (value: string) => {
        updateFilter('priceValue', value);
        if (value !== 'custom') {
            updateFilter('customMinPrice', '');
            updateFilter('customMaxPrice', '');
        }
    };


    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={[
                    styles.modalContainer,
                    { backgroundColor: colors.cardBg, paddingBottom: insets.bottom + Layout.spacing.md }
                ]}>
                    {/* Modal Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: colors.borderColor }]}>
                        <ThemedText style={styles.modalTitle}>筛选餐厅</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>

                    {/* Modal Content */}
                    <ScrollView
                        style={styles.modalScrollView}
                        contentContainerStyle={styles.scrollContentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <PriceFilterGroup
                            selectedPriceValue={currentFilters.priceValue}
                            customMinPrice={currentFilters.customMinPrice}
                            customMaxPrice={currentFilters.customMaxPrice}
                            onPriceOptionSelect={handlePriceOptionSelect}
                            onCustomMinPriceChange={(text) => updateFilter('customMinPrice', text)}
                            onCustomMaxPriceChange={(text) => updateFilter('customMaxPrice', text)}
                        />
                        <DistanceFilterGroup
                            selectedDistance={currentFilters.distance}
                            onDistanceSelect={(value) => updateFilter('distance', value)}
                            isLocationAvailable={isLocationAvailable}
                        />
                        <CuisineFilterGroup
                            selectedCuisine={currentFilters.cuisine}
                            onCuisineSelect={(value) => updateFilter('cuisine', value)}
                            onMoreCuisinesPress={onMoreCuisinesPress}
                        />
                    </ScrollView>

                    {/* Modal Footer */}
                    <View style={[styles.modalFooter, { borderTopColor: colors.borderColor, backgroundColor: colors.cardBg }]}>
                        {/* <Button title="应用筛选" onPress={handleApply} /> */}
                        <TouchableOpacity
                            style={[styles.applyButton, { backgroundColor: commonColors.primary }]}
                            onPress={handleApply}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.applyButtonText}>应用筛选</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end', // Modal 从底部出现
        backgroundColor: 'rgba(0,0,0,0.5)', // 半透明遮罩
    },
    modalContainer: {
        maxHeight: '85%', // 限制最大高度
        borderTopLeftRadius: Layout.borderRadius.lg,
        borderTopRightRadius: Layout.borderRadius.lg,
        overflow: 'hidden', // 确保圆角对内部内容生效
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.page,
        paddingVertical: Layout.spacing.md,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: Layout.fontSize.xl, // 1.1rem
        fontWeight: Layout.fontWeight.semibold,
    },
    closeButton: {
        padding: Layout.spacing.xs,
    },
    modalScrollView: {
        // flexGrow: 1, // 允许滚动视图在有空间时填充
    },
    scrollContentContainer: {
        padding: Layout.spacing.page, // 1.5rem in css (.modal-content)
    },
    modalFooter: {
        paddingHorizontal: Layout.spacing.page,
        paddingVertical: Layout.spacing.md,
        borderTopWidth: 1,
    },
    applyButton: {
        height: Layout.buttonHeight,
        borderRadius: Layout.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyButtonText: {
        color: Colors.common.white,
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.semibold,
    },
});

export default FilterModal;
