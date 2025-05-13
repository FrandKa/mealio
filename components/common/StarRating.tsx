// components/common/StarRating.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors'; // 使用我们定义的颜色
import { useColorScheme } from '@/hooks/useColorScheme';

type StarRatingProps = {
    rating: number;
    maxStars?: number;
    starSize?: number;
    starColor?: string; // 可选，覆盖默认颜色
};

const StarRating: React.FC<StarRatingProps> = ({
                                                   rating,
                                                   maxStars = 5,
                                                   starSize = 16,
                                               }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme]; // 获取当前主题的颜色
    const actualStarColor = colors.starColor; // 使用主题中的 starColor

    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.45; // 0.45 或更高算半星 (调整阈值)
    const emptyStars = maxStars - fullStars - (halfStar ? 1 : 0);

    const stars = [];

    for (let i = 0; i < fullStars; i++) {
        stars.push(<FontAwesome key={`full-${i}`} name="star" size={starSize} color={actualStarColor} />);
    }
    if (halfStar) {
        stars.push(<FontAwesome key="half" name="star-half-empty" size={starSize} color={actualStarColor} />);
        // 或者 'star-half-full', 'star-half-o' (FontAwesome旧版)
        // FontAwesome 5+ 使用 'star-half-alt'
    }
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<FontAwesome key={`empty-${i}`} name="star-o" size={starSize} color={actualStarColor} />);
        // 或者 'star-outline' for MaterialCommunityIcons
    }

    return <View style={styles.container}>{stars}</View>;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default StarRating;
