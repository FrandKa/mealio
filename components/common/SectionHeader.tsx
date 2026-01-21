// components/common/SectionHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // 用于筛选图标
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText'; // 使用您项目中的 ThemedText

type SectionHeaderProps = {
    title: string;
    showFilterButton?: boolean;
    filterText?: string;
    onFilterPress?: () => void;
};

const SectionHeader: React.FC<SectionHeaderProps> = ({
                                                         title,
                                                         showFilterButton = true,
                                                         filterText = "筛选",
                                                         onFilterPress,
                                                     }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={styles.container}>
            <ThemedText type="title" style={styles.title}>{title}</ThemedText>
            {showFilterButton && (
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        {
                            backgroundColor: colors.cardBg,
                            borderColor: colors.borderColor,
                        }
                    ]}
                    onPress={onFilterPress}
                    activeOpacity={0.7}
                >
                    <ThemedText style={[styles.filterButtonText, { color: colors.primaryDark || colors.primary }]}>
                        {/* HTML 中是 #current-price-filter-text，这里简化为传入的 filterText 或默认值 */}
                        {filterText}
                    </ThemedText>
                    <FontAwesome
                        name="sliders" // fas fa-sliders-h 在免费版 FontAwesome 中是 'sliders'
                        size={16} // 调整大小以匹配视觉
                        color={colors.textSubtle}
                        style={styles.filterIcon}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.page,
        paddingVertical: Layout.spacing.md, // HTML 中是 1rem 上下
        // marginTop: Layout.spacing.sm, // 如果 BannerSlider 和它之间需要额外间距
    },
    title: {
        // ThemedText type="title" 应该已经处理了大部分样式 (fontSize, fontWeight)
        // color 通过 ThemedText 处理
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Layout.spacing.sm - 2, // 对应 0.4rem
        paddingHorizontal: Layout.spacing.sm + 2, // 对应 0.8rem
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        ...Layout.shadow.sm, // 应用阴影
    },
    filterButtonText: {
        fontSize: Layout.fontSize.sm, // 对应 0.85rem
        fontWeight: Layout.fontWeight.medium,
        marginRight: Layout.spacing.xs,
    },
    filterIcon: {
        // marginLeft: Layout.spacing.xs, // 图标和文字之间的间距，由filterButtonText的marginRight控制
    },
});

export default SectionHeader;
