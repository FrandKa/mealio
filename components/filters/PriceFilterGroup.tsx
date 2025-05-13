// components/filters/PriceFilterGroup.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import FilterChip from '@/components/common/FilterChip';
import { ThemedText } from '@/components/ThemedText';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';

export type PriceOption = {
    label: string;
    value: string; // e.g., "", "1-50", "50-100", "custom"
};

type PriceFilterGroupProps = {
    selectedPriceValue: string; // 当前选中的预设价格范围的 value
    customMinPrice: string;
    customMaxPrice: string;
    onPriceOptionSelect: (value: string) => void;
    onCustomMinPriceChange: (text: string) => void;
    onCustomMaxPriceChange: (text: string) => void;
};

const priceOptions: PriceOption[] = [
    { label: '全部', value: '' },
    { label: '¥1-50', value: '1-50' },
    { label: '¥50-100', value: '50-100' },
    { label: '¥100-300', value: '100-300' },
    { label: '¥300+', value: '300+' },
];

const PriceFilterGroup: React.FC<PriceFilterGroupProps> = ({
                                                               selectedPriceValue,
                                                               customMinPrice,
                                                               customMaxPrice,
                                                               onPriceOptionSelect,
                                                               onCustomMinPriceChange,
                                                               onCustomMaxPriceChange,
                                                           }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleChipPress = (value: string) => {
        onPriceOptionSelect(value);
    };

    // 当用户开始输入自定义价格时，自动将选中模式切换到 "custom"
    const handleCustomInputFocus = () => {
        if (selectedPriceValue !== 'custom') {
            onPriceOptionSelect('custom');
        }
    };


    return (
        <View style={styles.groupContainer}>
            <View style={styles.titleContainer}>
                <FontAwesome name="dollar" size={18} color={colors.primary} />
                <ThemedText style={styles.groupTitle}>价格范围</ThemedText>
            </View>
            <View style={styles.optionsContainer}>
                {priceOptions.map((option) => (
                    <FilterChip
                        key={option.value}
                        label={option.label}
                        isActive={selectedPriceValue === option.value && selectedPriceValue !== 'custom'}
                        onPress={() => handleChipPress(option.value)}
                    />
                ))}
            </View>

            <View style={styles.customPriceSection}>
                <ThemedText style={styles.customPriceTitle}>或输入自定义范围:</ThemedText>
                <View style={styles.priceRangeContainer}>
                    <TextInput
                        style={[styles.priceInput, { backgroundColor: colors.background, borderColor: colors.borderColor, color: colors.text }]}
                        placeholder="最低 ¥"
                        placeholderTextColor={colors.textLight}
                        keyboardType="number-pad"
                        value={customMinPrice}
                        onChangeText={onCustomMinPriceChange}
                        onFocus={handleCustomInputFocus}
                        // disabled={selectedPriceValue !== 'custom'} // 禁用逻辑可以由父组件控制是否清空值
                    />
                    <Text style={[styles.priceRangeSeparator, {color: colors.textLight}]}>-</Text>
                    <TextInput
                        style={[styles.priceInput, { backgroundColor: colors.background, borderColor: colors.borderColor, color: colors.text }]}
                        placeholder="最高 ¥"
                        placeholderTextColor={colors.textLight}
                        keyboardType="number-pad"
                        value={customMaxPrice}
                        onChangeText={onCustomMaxPriceChange}
                        onFocus={handleCustomInputFocus}
                        // disabled={selectedPriceValue !== 'custom'}
                    />
                </View>
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

export default PriceFilterGroup;
