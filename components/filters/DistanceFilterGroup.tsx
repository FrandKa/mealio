// components/filters/DistanceFilterGroup.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import FilterChip from '@/components/common/FilterChip';
import { ThemedText } from '@/components/ThemedText';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';

export type DistanceOption = {
    label: string;
    value: string | null; // km, or null for "any"
};

type DistanceFilterGroupProps = {
    selectedDistance: string | null;
    onDistanceSelect: (value: string | null) => void;
    isLocationAvailable: boolean; // 是否已获取到位置
};

const distanceOptions: DistanceOption[] = [
    { label: '任何距离', value: null },
    { label: '1 km 内', value: '1' },
    { label: '3 km 内', value: '3' },
    { label: '5 km 内', value: '5' },
    { label: '10 km 内', value: '10' },
];

const DistanceFilterGroup: React.FC<DistanceFilterGroupProps> = ({
                                                                     selectedDistance,
                                                                     onDistanceSelect,
                                                                     isLocationAvailable,
                                                                 }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={styles.groupContainer}>
            <View style={styles.titleContainer}>
                <FontAwesome name="map-marker" size={18} color={colors.primary} />
                <ThemedText style={styles.groupTitle}>距离范围 (附近)</ThemedText>
            </View>
            <View style={styles.optionsContainer}>
                {distanceOptions.map((option) => (
                    <FilterChip
                        key={option.label}
                        label={option.label}
                        isActive={selectedDistance === option.value}
                        onPress={() => onDistanceSelect(option.value)}
                        disabled={option.value !== null && !isLocationAvailable} // 只有"任何距离"在无位置时可选
                    />
                ))}
            </View>
            {!isLocationAvailable && (
                <ThemedText style={[styles.warningText, { color: colors.textLight }]}>
                    需要获取您的位置才能按距离筛选。
                </ThemedText>
            )}
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

export default DistanceFilterGroup;
