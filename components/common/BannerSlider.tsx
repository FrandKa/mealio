// components/common/BannerSlider.tsx
import React from 'react';
import {View, Image, Text, StyleSheet, Dimensions, Platform} from 'react-native';
import Swiper from 'react-native-swiper'; // 导入 Swiper
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';

// 模拟的 Banner 数据
const mockBanners = [
    {
        id: '1',
        imageUrl: 'http://www.canyingji.com/uploadfiles/202004/20200402171459645964.jpg',
        title: '今日特惠!',
    },
    {
        id: '2',
        imageUrl: 'http://www.canyingji.com/uploadfiles/202004/20200402171384148414.jpg',
        title: '新鲜美味',
    },
    {
        id: '3',
        imageUrl: 'https://www.canting-cn.net/storage/2242/article/20231101/1698831767736339.jpg',
        title: '强烈推荐',
    },
];

export type BannerItem = {
    id: string;
    imageUrl: string;
    title?: string;
    onPress?: () => void;
};

type BannerSliderProps = {
    banners?: BannerItem[];
};

const { width: screenWidth } = Dimensions.get('window');
const bannerHeight = Platform.OS === 'web' ? 400 : 160; // 与 CSS 中的 height 一致

const BannerSlider: React.FC<BannerSliderProps> = ({ banners = mockBanners }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    if (!banners || banners.length === 0) {
        return null; // 如果没有 banner 数据，不渲染任何东西
    }

    return (
        <View style={[styles.wrapper, { backgroundColor: colors.placeholderBg }]}>
            <Swiper
                style={styles.swiper}
                autoplay
                autoplayTimeout={4} // 对应 CSS 中的 4000ms
                loop
                paginationStyle={styles.paginationStyle}
                dotStyle={[styles.dot, { backgroundColor: 'rgba(255, 255, 255, 0.6)'}]}
                activeDotStyle={[styles.dot, { backgroundColor: Colors.common.white }]}
                // showsButtons // 如果需要左右箭头按钮
                // nextButton={<Text style={styles.buttonText}>›</Text>}
                // prevButton={<Text style={styles.buttonText}>‹</Text>}
            >
                {banners.map((banner) => (
                    <View style={styles.slide} key={banner.id}>
                        <Image source={{ uri: banner.imageUrl }} style={styles.image} resizeMode="cover" />
                        {banner.title && (
                            <View style={styles.titleContainer}>
                                <Text style={styles.bannerTitle}>{banner.title}</Text>
                            </View>
                        )}
                    </View>
                ))}
            </Swiper>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        height: bannerHeight,
        borderRadius: Layout.borderRadius.lg,
        overflow: 'hidden', // 确保圆角生效
        marginHorizontal: Layout.spacing.page, // 与 CSS .banner-section margin 对应
        marginTop: Layout.spacing.md,       // 与 CSS .banner-section margin-top 对应
        ...Layout.shadow.md, // 应用阴影
    },
    swiper: {
        // Swiper 内部会处理高度，但有时需要明确设置
        // height: bannerHeight,
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent', // Slide 背景透明，让 wrapper 背景或图片显示
    },
    image: {
        width: '100%', // 图片宽度充满 slide
        height: '100%', // 图片高度充满 slide
    },
    titleContainer: {
        position: 'absolute',
        bottom: Layout.spacing.sm + 5, // 对应 0.75rem + 额外调整
        left: Layout.spacing.md,   // 对应 1rem
        right: Layout.spacing.md + 50, // 给分页器留出空间
        backgroundColor: 'rgba(0,0,0,0)', // 轻微背景增强可读性
        paddingVertical: Layout.spacing.xs,
        paddingHorizontal: Layout.spacing.sm,
        borderRadius: Layout.borderRadius.sm,
    },
    bannerTitle: {
        color: Colors.common.white,
        fontSize: Layout.fontSize.xl, // 对应 1.2rem
        fontWeight: Layout.fontWeight.semibold, // 对应 font-weight: 600
        // textShadowColor: 'rgba(0, 0, 0, 0.6)', // RN textShadow 与 CSS 略有不同
        // textShadowOffset: { width: 1, height: 1 },
        // textShadowRadius: 4,
    },
    paginationStyle: {
        bottom: Layout.spacing.sm + 5, // 对应 0.75rem，调整使视觉居中
        right: Layout.spacing.md, // 对应 1rem
        left: undefined, // 取消默认的居中
        alignItems: 'flex-end',
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginHorizontal: 3, // 对应 gap: 5px 的一半
    },
    // buttonText: { // 如果使用 showsButtons
    //   fontSize: 30,
    //   color: Colors.common.white,
    // },
});

export default BannerSlider;
