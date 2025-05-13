// components/filters/CuisineFilterGroup.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // fas fa-utensils
import FilterChip from '@/components/common/FilterChip';
import { ThemedText } from '@/components/ThemedText';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';

export type CuisineOption = {
    label: string;
    value: string; // e.g., "", "火锅", "川菜"
};

type CuisineFilterGroupProps = {
    selectedCuisine: string;
    onCuisineSelect: (value: string) => void;
    onMoreCuisinesPress: () => void;
    // 预设的菜系选项，可以从外部传入或在这里定义
    predefinedCuisines?: CuisineOption[];
};

const defaultPredefinedCuisines: CuisineOption[] = [
    { label: '所有菜系', value: '' },
    { label: '火锅', value: '火锅' },
    // ... 可以添加几个最常见的
];

const CuisineFilterGroup: React.FC<CuisineFilterGroupProps> = ({
                                                                   selectedCuisine,
                                                                   onCuisineSelect,
                                                                   onMoreCuisinesPress,
                                                                   predefinedCuisines = defaultPredefinedCuisines,
                                                               }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // 检查当前选中的菜系是否在预设列表中，如果不在，则动态添加一个临时的Chip
    const displayedCuisines = [...predefinedCuisines];
    if (selectedCuisine && !predefinedCuisines.find(c => c.value === selectedCuisine)) {
        displayedCuisines.splice(1, 0, { label: selectedCuisine, value: selectedCuisine }); // 插入到“所有菜系”之后
    }


    return (
        <View style={styles.groupContainer}>
            <View style={styles.titleContainer}>
                <FontAwesome name="cutlery" size={18} color={colors.primary} /> {/* 'utensils' is alias for 'cutlery' in FA5 Free */}
                <ThemedText style={styles.groupTitle}>菜系分类</ThemedText>
            </View>
            <View style={styles.optionsContainer}>
                {displayedCuisines.map((option) => (
                    <FilterChip
                        key={option.value || 'all-cuisines'}
                        label={option.label}
                        isActive={selectedCuisine === option.value}
                        onPress={() => onCuisineSelect(option.value)}
                    />
                ))}
                <FilterChip
                    label="更多菜系..."
                    onPress={onMoreCuisinesPress}
                    style={{ backgroundColor: colors.placeholderBg }} // action-chip style
                    textStyle={{ color: colors.primary }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    groupContainer: {
        marginBottom: Layout.spacing.lg,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
    },
    groupTitle: {
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.semibold,
        marginLeft: Layout.spacing.sm,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    customPriceSection: {
        marginTop: Layout.spacing.md,
    },
    customPriceTitle: {
        fontSize: Layout.fontSize.sm,
        color: Colors.common.textLight,
        marginBottom: Layout.spacing.sm,
    },
    priceRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceInput: {
        flex: 1,
        height: Layout.inputHeight,
        borderWidth: 1,
        borderRadius: Layout.borderRadius.sm,
        paddingHorizontal: Layout.spacing.md,
        fontSize: Layout.fontSize.md,
    },
    priceRangeSeparator: {
        marginHorizontal: Layout.spacing.sm,
        fontSize: Layout.fontSize.lg,
    },
});

export default CuisineFilterGroup;
