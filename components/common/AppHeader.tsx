// components/common/AppHeader.tsx
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons'; // 使用 Ionicons 作为搜索图标
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 处理安全区域
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';

type AppHeaderProps = {
    onMenuPress?: () => void;
    onSearchPress?: () => void; // 当点击搜索图标时（如果输入框右侧有图标）
    searchPlaceholder?: string;
    searchTerm?: string;
    onSearchTermChange?: (text: string) => void;
    showMenuButton?: boolean;
    showSearchIcon?: boolean; // 是否在输入框右侧显示搜索图标
};

const AppHeader: React.FC<AppHeaderProps> = ({
                                                 onMenuPress,
                                                 onSearchPress,
                                                 searchPlaceholder = "搜索餐厅...",
                                                 searchTerm,
                                                 onSearchTermChange,
                                                 showMenuButton = true,
                                                 showSearchIcon = true,
                                             }) => {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={[
            styles.container,
            {
                paddingTop: insets.top + Layout.spacing.sm, // 顶部安全区域 + 一些间距
                backgroundColor: colors.cardBg,
                borderBottomColor: colors.borderColor,
            }
        ]}>
            <View style={styles.content}>
                {showMenuButton && (
                    <TouchableOpacity onPress={onMenuPress} style={styles.iconButton} accessibilityLabel="打开菜单">
                        <FontAwesome name="bars" size={22} color={colors.textLight} />
                    </TouchableOpacity>
                )}
                <View style={styles.searchBox}>
                    <TextInput
                        style={[styles.searchInput, {
                            backgroundColor: colors.background,
                            borderColor: colors.borderColor,
                            color: colors.text,
                        }]}
                        placeholder={searchPlaceholder}
                        placeholderTextColor={colors.textLight}
                        value={searchTerm}
                        onChangeText={onSearchTermChange}
                        returnKeyType="search"
                        onSubmitEditing={onSearchPress} // 当键盘上的搜索按钮被按下
                    />
                </View>
                {showSearchIcon && (
                    <TouchableOpacity onPress={onSearchPress} style={styles.iconButton} accessibilityLabel="搜索">
                        <Ionicons name="search" size={22} color={colors.textLight} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: Layout.headerHeight + (Platform.OS === 'ios' ? 20 : Layout.spacing.sm), // 基础高度 + 顶部间距 (粗略估计)
        paddingBottom: Layout.spacing.sm,
        paddingHorizontal: Layout.spacing.page,
        borderBottomWidth: 1,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: Layout.spacing.sm,
    },
    searchBox: {
        flex: 1,
        marginHorizontal: Layout.spacing.sm,
    },
    searchInput: {
        height: 38, // 调整高度以匹配视觉
        paddingHorizontal: Layout.spacing.md,
        borderRadius: Layout.borderRadius.pill, // 胶囊形状
        borderWidth: 1,
        fontSize: Layout.fontSize.md,
    },
});

export default AppHeader;
