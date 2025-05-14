// components/common/RestaurantListItem.tsx
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome, AntDesign } from '@expo/vector-icons'; // AntDesign for heart icon for variety
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import StarRating from './StarRating'; // 我们稍后会创建这个
import { Restaurant } from '@/types';

// 模拟的餐厅数据类型，后续会从 types/index.ts 导入

type RestaurantListItemProps = {
    restaurant: Restaurant;
    onPress?: (restaurantId: string) => void;
    onToggleFavorite?: (restaurantId: string, isFavorite: boolean) => void;
    isFavoriteInitial?: boolean; // 初始收藏状态
};

const RestaurantListItem: React.FC<RestaurantListItemProps> = ({
                                                                   restaurant,
                                                                   onPress,
                                                                   onToggleFavorite,
                                                                   isFavoriteInitial = false,
                                                               }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);

    const handleFavoritePress = () => {
        const newFavStatus = !isFavorite;
        setIsFavorite(newFavStatus);
        onToggleFavorite?.(restaurant._id, newFavStatus);
        // TODO: 调用 useRestaurants hook 中的方法更新全局收藏状态和购物车动画
    };

    const handleItemPress = () => {
        onPress?.(restaurant._id);
        // 在实际应用中，可能会导航到详情页
        // if (restaurant['详情链接']) Linking.openURL(restaurant['详情链接']);
    };

    // 解析评分，优先用 店铺总分
    const rating = parseFloat(String(restaurant['店铺总分'] || restaurant['店铺均分'] || 0));
    const avgPrice = restaurant['人均价格'] ? `¥${restaurant['人均价格']}` : '价格未知';
    const distance = restaurant.distance_km != null && restaurant.distance_km !== '?' ? `${restaurant.distance_km}km` : '';


    return (
        <TouchableOpacity onPress={handleItemPress} activeOpacity={0.8}>
            <ThemedView style={[styles.container, { shadowColor: colors.textDark }]}>
                <Image
                    source={{ uri: restaurant['图片链接'] || 'https://via.placeholder.com/80x80/E5E7EB/B0B0B0?text=No+Img' }}
                    style={styles.image}
                    onError={() => console.log("Error loading image for:", restaurant['店铺名'])} // 简单错误处理
                />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <ThemedText type="subtitle" style={styles.name} numberOfLines={1}>
                            {restaurant['店铺名']}
                        </ThemedText>
                        <View style={styles.ratingFavContainer}>
                            <StarRating rating={rating} starSize={14} />
                            <TouchableOpacity onPress={handleFavoritePress} style={styles.favButton}>
                                <AntDesign
                                    name={isFavorite ? "heart" : "hearto"}
                                    size={20}
                                    color={isFavorite ? colors.heartColor : colors.textLight}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ThemedText style={styles.infoLine} numberOfLines={1}>
                        {restaurant['标签1'] || '餐厅'}
                        <Text style={styles.separator}> | </Text>
                        人均: {avgPrice}
                        {distance ? <><Text style={styles.separator}> | </Text>距离: {distance}</> : ''}
                    </ThemedText>

                    <ThemedText style={styles.supportingText} numberOfLines={1}>
                        {restaurant['推荐菜']?.[0] || '探索美味佳肴...'}
                    </ThemedText>
                </View>
            </ThemedView>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        backgroundColor: Colors.common.cardBg, // ThemedView 会处理主题色，但可以设个默认
        marginBottom: Layout.spacing.sm + 2, // 0.75rem
        ...Layout.shadow.sm, // 应用阴影
    },
    image: {
        width: 70,
        height: 70,
        borderRadius: Layout.borderRadius.md,
        backgroundColor: Colors.common.placeholderBg, // 图片加载时的背景
        marginRight: Layout.spacing.md,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between', // 分散内容，使推荐菜靠近底部
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // 名字和评分收藏区顶部对齐
        marginBottom: Layout.spacing.xs,
    },
    name: {
        flex: 1, // 允许名字伸缩并应用 numberOfLines
        marginRight: Layout.spacing.sm, // 与右侧图标间距
        // ThemedText type="subtitle" 控制了大部分字体样式
    },
    ratingFavContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    favButton: {
        marginLeft: Layout.spacing.sm, // 星星和心形图标的间距
        padding: Layout.spacing.xs / 2, // 增加点击区域
    },
    infoLine: {
        fontSize: Layout.fontSize.sm - 1, // 0.85rem, 稍小一点
        color: Colors.common.textLight, // ThemedText 会处理，但可指定
        marginBottom: Layout.spacing.xs,
    },
    separator: {
        marginHorizontal: Layout.spacing.xs,
        opacity: 0.6,
    },
    supportingText: {
        fontSize: Layout.fontSize.sm - 2, // 0.8rem
        color: Colors.common.textLight, // ThemedText 会处理
        marginTop: Layout.spacing.xs / 2,
    },
});

export default RestaurantListItem;
