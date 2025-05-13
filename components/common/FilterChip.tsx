// components/common/FilterChip.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText'; // 或您自定义的文本组件

type FilterChipProps = {
    label: string;
    onPress?: (event: GestureResponderEvent) => void;
    isActive?: boolean;
    style?: object; // 允许传入额外样式
    textStyle?: object;
    disabled?: boolean;
};

const FilterChip: React.FC<FilterChipProps> = ({
                                                   label,
                                                   onPress,
                                                   isActive = false,
                                                   style,
                                                   textStyle,
                                                   disabled = false,
                                               }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const commonColors = Colors.common; // 使用 commonColors

    const chipBackgroundColor = isActive
        ? commonColors.primary // --primary
        : commonColors.background; // --background or --placeholder-bg (CSS .modal-chip)
    const chipBorderColor = isActive
        ? commonColors.primary
        : commonColors.borderColor; // --border-color
    const chipTextColor = isActive ? commonColors.white : commonColors.textDark;

    return (
        <TouchableOpacity
            style={[
                styles.chip,
                {
                    backgroundColor: chipBackgroundColor,
                    borderColor: chipBorderColor,
                    opacity: disabled ? 0.6 : 1,
                },
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
        >
            <ThemedText
                style={[
                    styles.chipText,
                    { color: chipTextColor },
                    textStyle,
                ]}
            >
                {label}
            </ThemedText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    chip: {
        paddingVertical: Layout.spacing.sm - 2, // 0.5rem
        paddingHorizontal: Layout.spacing.md - 2, // 1rem
        borderRadius: Layout.borderRadius.pill, // 50px
        borderWidth: 1,
        marginRight: Layout.spacing.sm, // gap
        marginBottom: Layout.spacing.sm, // gap for wrapping
    },
    chipText: {
        fontSize: Layout.fontSize.sm, // 0.9rem
        fontWeight: Layout.fontWeight.medium,
    },
});

export default FilterChip;
