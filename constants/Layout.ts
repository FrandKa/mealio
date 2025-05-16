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
        xxs: 4,
        xs: 8,  // Changed from 4 to 8 for more distinct spacing steps
        sm: 12, // Changed from 8 to 12
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
        page: 16, // Default horizontal padding for pages
    },
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 16, // Good for larger cards or main buttons
        xl: 24, // Added for very rounded elements like some modals
        pill: 50, // For pill-shaped buttons/chips
        circle: screenWidth / 2, // For perfect circles
        full: 999, // For ensuring small elements are circular
    },
    headerHeight: 56,
    bottomNavHeight: 60,
    fontSize: {
        xs: 10,
        sm: 12,
        md: 14, // Standard body text
        lg: 16, // Slightly larger body text or subtitles
        xl: 18, // Larger subtitles or small titles
        // title: 20, // Defined below as titleS, titleM, titleL for more granularity
        header: 24, // For main screen titles
        display: 36, // For very large display text like "Welcome to Ktr"

        // More granular title sizes
        titleS: 20, // Small title
        titleM: 24, // Medium title (replaces 'header' for clarity)
        titleL: 28, // Large title
    },
    fontWeight: {
        light: '300' as '300',
        normal: '400' as '400',
        medium: '500' as '500',
        semibold: '600' as '600',
        bold: '700' as '700',
        extrabold: '800' as '800', // Added
        black: '900' as '900',     // Added
    },
    shadow: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 5,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 15,
            elevation: 8,
        }
    },
    inputHeight: 48, // Slightly increased for better touch target
    buttonHeight: 50, // Slightly increased
    OTP_LENGTH: 4,
};
