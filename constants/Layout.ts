// constants/Layout.ts
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 基于 CSS 变量和常见 UI 模式
export default {
    screen: {
        width: screenWidth,
        height: screenHeight,
    },
    spacing: {
        xs: 4,  // Extra small
        sm: 8,  // Small
        md: 16, // Medium (e.g., padding for sections, cards)
        lg: 24, // Large
        xl: 32, // Extra large
        page: 16, // Default horizontal padding for pages (based on CSS 1rem for padding)
    },
    borderRadius: {
        sm: 4,  // --radius-sm
        md: 8,  // --radius-md
        lg: 16, // --radius-lg
        pill: 50, // For pill-shaped buttons/chips
        circle: screenWidth / 2, // For perfect circles (if needed)
    },
    headerHeight: 56, // --header-height
    bottomNavHeight: 60, // --bottom-nav-height
    fontSize: {
        xs: 10, // 0.6rem - 0.7rem
        sm: 12, // 0.75rem - 0.85rem
        md: 14, // 0.875rem - 0.9rem
        lg: 16, // 1rem
        xl: 18, // 1.1rem - 1.2rem
        title: 20, // ~1.3rem for section titles
        header: 24, // Larger titles
    },
    fontWeight: {
        light: '300' as '300',
        normal: '400' as '400',
        medium: '500' as '500',
        semibold: '600' as '600',
        bold: '700' as '700',
    },
    // 可以添加其他从 CSS 中提取的布局常量，例如阴影
    // React Native 的阴影与 CSS 不同，通常使用 shadowColor, shadowOffset, shadowOpacity, shadowRadius (iOS) 和 elevation (Android)
    shadow: {
        sm: { // --shadow-sm
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2, // Android
        },
        md: { // --shadow-md
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1, // Roughly (0.1 + 0.06)/2
            shadowRadius: 6, // Roughly (6 + 4)/2
            elevation: 5, // Android
        },
        lg: { // --shadow-lg
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 15,
            elevation: 8, // Android
        }
    },
    inputHeight: 44, // 常见输入框高度
    buttonHeight: 48, // 常见按钮高度
};
