// components/filters/FilterModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PriceFilterGroup /*, { PriceOption } // PriceOption 不再需要导出或在此处使用 */ from './PriceFilterGroup';
import DistanceFilterGroup /*, { DistanceOption } */ from './DistanceFilterGroup';
import CuisineFilterGroup /*, { CuisineOption } */ from './CuisineFilterGroup';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
// import Button from '@/components/ui/Button'; // <--- 移除或注释掉，因为我们不用它

// 从 types/index.ts 导入类型
import { AppliedFilters } from '@/types'; // <--- 改为从 types 导入

// FilterModalProps 现在使用导入的 AppliedFilters
type FilterModalProps = {
    isVisible: boolean;
    onClose: () => void;
    onApplyFilters: (filters: AppliedFilters) => void; // <--- 使用 AppliedFilters
    initialFilters: AppliedFilters;                  // <--- 使用 AppliedFilters
    isLocationAvailable: boolean;
    onMoreCuisinesPress: () => void;
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

    // 内部状态现在也使用 AppliedFilters
    const [currentFilters, setCurrentFilters] = useState<AppliedFilters>(initialFilters); // <--- 使用 AppliedFilters

    useEffect(() => {
        setCurrentFilters(initialFilters);
    }, [initialFilters]);

    const handleApply = () => {
        let finalFilters = { ...currentFilters };
        if (finalFilters.priceValue === 'custom') {
            const minP = parseFloat(finalFilters.customMinPrice);
            const maxP = parseFloat(finalFilters.customMaxPrice);
            if (!isNaN(minP) && !isNaN(maxP) && minP > maxP) {
                [finalFilters.customMinPrice, finalFilters.customMaxPrice] = [finalFilters.customMaxPrice, finalFilters.customMinPrice];
            }
        }
        onApplyFilters(finalFilters);
        onClose();
    };

    // keyof AppliedFilters 确保了类型安全
    const updateFilter = (key: keyof AppliedFilters, value: any) => { // <--- 使用 keyof AppliedFilters
        setCurrentFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePriceOptionSelect = (value: string) => {
        updateFilter('priceValue', value);
        if (value !== 'custom') {
            updateFilter('customMinPrice', '');
            updateFilter('customMaxPrice', '');
        }
    };

    // ... (剩余的 return JSX 和 styles 部分保持不变)
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

// styles 部分保持不变
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
