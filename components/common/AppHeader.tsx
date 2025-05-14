// components/common/AppHeader.tsx
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';

type AppHeaderProps = {
    onMenuPress?: () => void;
    onSearchPress?: () => void;
    searchPlaceholder?: string;
    searchTerm?: string;
    onSearchTermChange?: (text: string) => void;
    showMenuButton?: boolean;
    showSearchIcon?: boolean;
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

    // Define a base height for the content area of the header
    // This should be the height of the search bar row itself, e.g., searchInput height + some vertical padding for content
    const contentRowHeight = Layout.headerHeight > 0 ? Layout.headerHeight : 44; // e.g. 44 or based on searchInput height

    return (
        <View style={[
            styles.container, // Basic layout like paddingHorizontal, borderBottomWidth
            {
                paddingTop: insets.top + Layout.spacing.sm, // Add safe area inset and a small margin
                paddingBottom: Layout.spacing.sm,          // Add some padding at the bottom of the header
                backgroundColor: colors.cardBg,
                borderBottomColor: colors.borderColor,
                // The total height will be determined by paddingTop, content height, and paddingBottom
            }
        ]}>
            <View style={[styles.content, { height: contentRowHeight }]}>
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
                        onSubmitEditing={onSearchPress}
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
        // REMOVED: height: Layout.headerHeight + (Platform.OS === 'ios' ? 20 : Layout.spacing.sm),
        // paddingBottom is now applied dynamically above for clarity, or could be kept here.
        paddingHorizontal: Layout.spacing.page,
        borderBottomWidth: 1,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        // height: Layout.headerHeight, // Or some fixed value like 44, or based on searchInput height
        // This height is for the row containing icons and search input
        // This is now set dynamically in the component for clarity
    },
    iconButton: {
        padding: Layout.spacing.sm,
        justifyContent: 'center', // Ensure icon is vertically centered if content row is taller
        alignItems: 'center',
    },
    searchBox: {
        flex: 1,
        marginHorizontal: Layout.spacing.sm,
        justifyContent: 'center', // Vertically center TextInput within searchBox
    },
    searchInput: {
        height: 44, // This seems like a reasonable fixed height for the input
        paddingHorizontal: Layout.spacing.md,
        borderRadius: Layout.borderRadius.pill,
        borderWidth: 1,
        fontSize: Layout.fontSize.md,
        // textAlignVertical: 'center', // Useful on Android if text isn't centered
    },
});

export default AppHeader;
