// constants/Colors.ts

const primary = '#6D28D9'; // Purple-600 - Main brand purple
const primaryLight = '#A78BFA'; // Purple-400
const primaryDark = '#5B21B6'; // Purple-700

const textDarkBase = '#111827';
const textLightBase = '#6B7280';

const backgroundLight = '#F9FAFB';
const backgroundDark = '#120E1C'; // 你选择的深色背景

const cardBgLight = '#FFFFFF';
const cardBgDark = '#1F2937';

const borderColorLight = '#E5E7EB';
const borderColorDark = '#374151';

const placeholderBgBase = '#F3F4F6';

const secondary = '#1F2937'; // Gray-800
const textDark = '#111827'; // Gray-900
const textLight = '#6B7280'; // Gray-500
const background = '#F9FAFB'; // Gray-50
const cardBg = '#FFFFFF';
const borderColor = '#E5E7EB'; // Gray-200
const placeholderBg = '#F3F4F6'; // Gray-100
const starColor = '#FBBF24'; // Amber-400
const heartColor = '#F43F5E'; // Rose-500

// --- Auth Screen Specific Colors (Purple Theme) ---
// 这些颜色是基于你提供的 UI 截图中的深紫色背景和亮色元素
const authScreenBackground = '#2C1D4A'; // 深紫色背景 (统一用于浅色和深色模式下的认证屏幕)
const authPrimaryButtonColor = '#8A2BE2'; // 亮紫色按钮 (BlueViolet)
const authPrimaryButtonTextColor = '#FFFFFF';
const authSecondaryButtonBackground = '#FFFFFF'; // 白色背景的次要按钮
const authSecondaryButtonTextColor = authScreenBackground; // 次要按钮文字颜色与背景色一致以形成对比
const authInputBackgroundColor = 'rgba(255, 255, 255, 0.1)'; // 输入框轻微透明背景
const authInputTextColor = '#FFFFFF'; // 输入框文字白色
const authInputPlaceholderColor = 'rgba(255, 255, 255, 0.6)'; // 输入框占位符文字颜色
const authSubtleTextColor = '#E0E0E0'; // 用于副标题或描述性文字的浅灰色/白色

export default {
  light: {
    textSubtle: textLightBase, // 使用基础的浅色文本作为 subtle
    cardBg: cardBgLight,
    borderColor: borderColorLight,
    placeholderBg: placeholderBgBase,
    starColor: starColor,
    heartColor: heartColor,
    lightPurpleBackground: '#EDE9FE',
    purpleTagText: '#5B21B6',
    tagBorder: '#C4B5FD',
    backgroundOpacified: 'rgba(249, 250, 251, 0.8)',
    text: textDark,
    background: background,
    tint: primary, // 或者您已有的 tintColorLight
    icon: textLight,
    tabIconDefault: textLight,
    tabIconSelected: primary,
    primary: primary,
    primaryLight: primaryLight,
    primaryDark: primaryDark,
    secondary: secondary,
    textLight: textLight,

    // --- 添加 Auth 相关的颜色键 ---
    authBackground: authScreenBackground,
    authPrimaryButton: authPrimaryButtonColor,
    authPrimaryButtonText: authPrimaryButtonTextColor,
    authSecondaryButton: authSecondaryButtonBackground,
    authSecondaryButtonText: authSecondaryButtonTextColor,
    authInputBackground: authInputBackgroundColor,
    authInputText: authInputTextColor,
    authInputPlaceholder: authInputPlaceholderColor,
    authTextSubtle: authSubtleTextColor,
    inputBackground: 'rgba(255,255,255,1)',
    tintOpacified: 'rgba(109, 40, 217, 0.7)'
  },
  dark: {
    tintOpacified: 'rgba(167, 139, 250, 0.7)',
    inputBackground: 'rgba(255,255,255,1)',
    text: '#F9FAFB', // 之前你设定的是 '#fff'，这里用一个更具体的灰白色
    background: backgroundDark, // 使用你定义的深色背景
    tint: primaryLight,
    icon: '#A1A1AA', // 之前是 '#ccc'
    tabIconDefault: '#9CA3AF', // 之前是 '#ccc'
    tabIconSelected: primaryLight,
    primary: primaryLight,
    primaryDark: primary,
    secondary: '#E5E7EB',
    textSubtle: '#9CA3AF',
    cardBg: cardBgDark,
    borderColor: borderColorDark,
    placeholderBg: '#374151',
    starColor: starColor,
    heartColor: heartColor,
    lightPurpleBackground: '#37304A',
    purpleTagText: '#D8B4FE',
    tagBorder: '#5B21B6',
    backgroundOpacified: 'rgba(18, 14, 28, 0.8)',

    // --- 添加 Auth 相关的颜色键 (暗色模式下可能与浅色模式认证屏幕颜色一致或略作调整) ---
    authBackground: authScreenBackground, // 认证屏幕背景通常保持一致的品牌感
    authPrimaryButton: authPrimaryButtonColor, // 可以与浅色模式按钮颜色一致
    authPrimaryButtonText: authPrimaryButtonTextColor,
    authSecondaryButton: authSecondaryButtonBackground, // 白色按钮在深紫色背景上依然有效
    authSecondaryButtonText: authSecondaryButtonTextColor,
    authInputBackground: authInputBackgroundColor,
    authInputText: authInputTextColor,
    authInputPlaceholder: authInputPlaceholderColor,
    authTextSubtle: authSubtleTextColor,
  },
  common: {
    primary,
    primaryLight,
    primaryDark,
    secondary, // common 中通常不放与主题强相关的 secondary
    textDark: textDarkBase, // common 中可以放基础的深色文本
    textLight: textLightBase, // common 中可以放基础的浅色文本
    background, // 主题相关
    cardBg, // 主题相关
    borderColor, // 主题相关
    placeholderBg: placeholderBgBase,
    starColor,
    heartColor,
    white: '#FFF',
    black: '#000',
    transparent: 'transparent',
    danger: '#DC2626',
    success: '#16A34A',
    warning: '#FBBF24',
  }
};
