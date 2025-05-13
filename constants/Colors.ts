// constants/Colors.ts

// 您项目中可能已有的颜色定义

// 从 mobile-restaurants.css 提取的颜色
const primary = '#6D28D9'; // Purple-600
const primaryLight = '#A78BFA'; // Purple-400
const primaryDark = '#5B21B6'; // Purple-700
const secondary = '#1F2937'; // Gray-800
const textDark = '#111827'; // Gray-900
const textLight = '#6B7280'; // Gray-500
const background = '#F9FAFB'; // Gray-50
const cardBg = '#FFFFFF';
const borderColor = '#E5E7EB'; // Gray-200
const placeholderBg = '#F3F4F6'; // Gray-100
const starColor = '#FBBF24'; // Amber-400
const heartColor = '#F43F5E'; // Rose-500

// 可以根据您的项目需要，将这些颜色组织到 light 和 dark 主题对象中
// 例如，如果您的 ThemedText/ThemedView 依赖 light/dark 对象：

export default {
  light: {
    text: textDark,
    background: background,
    tint: primary, // 或者您已有的 tintColorLight
    icon: textLight,
    tabIconDefault: textLight,
    tabIconSelected: primary,
    // 新增的颜色
    primary: primary,
    primaryLight: primaryLight,
    primaryDark: primaryDark,
    secondary: secondary,
    textLight: textLight,
    cardBg: cardBg,
    borderColor: borderColor,
    placeholderBg: placeholderBg,
    starColor: starColor,
    heartColor: heartColor,
    // ... 您已有的其他 light 主题颜色
  },
  dark: {
    text: '#fff', // 示例，您需要定义暗黑模式颜色
    background: '#000', // 示例
    tint: primaryLight, // 或者您已有的 tintColorDark
    icon: '#ccc',
    tabIconDefault: '#ccc',
    tabIconSelected: primaryLight,
    // 新增的颜色 (需要定义暗黑版本)
    primary: primaryLight,
    primaryDark: primary, // 示例
    secondary: '#E5E7EB', // 示例
    textLight: '#9CA3AF', // 示例
    cardBg: '#1F2937', // 示例
    borderColor: '#374151', // 示例
    placeholderBg: '#374151', // 示例
    starColor: starColor, // 可能不需要变
    heartColor: heartColor, // 可能不需要变
    // ... 您已有的其他 dark 主题颜色
  },
  // 可以直接导出的通用颜色 (如果不想严格区分主题)
  common: {
    primary,
    primaryLight,
    primaryDark,
    secondary,
    textDark,
    textLight,
    background,
    cardBg,
    borderColor,
    placeholderBg,
    starColor,
    heartColor,
    white: '#FFF',
    black: '#000',
    transparent: 'transparent',
    // 其他通用颜色
    danger: '#DC2626', // Red-600 for errors
    success: '#16A34A', // Green-600 for success
    warning: '#FBBF24', // Amber-400 (same as starColor)
  }
};
