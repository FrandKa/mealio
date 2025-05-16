// components/common/RestaurantListItem.tsx
import React, { useState, useEffect } from 'react'; // 导入 useEffect
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import StarRating from './StarRating';
import { Restaurant } from '@/types'; // 确保 Restaurant 类型包含 is_favorites

type RestaurantListItemProps = {
    restaurant: Restaurant & { is_favorites?: boolean }; // 明确 restaurant 可能包含 is_favorites
    onPress?: (restaurantId: string) => void;
    onToggleFavorite?: (restaurantId: string, isFavorite: boolean) => Promise<boolean | void>; // 改为 Promise 以处理异步操作
};

const RestaurantListItem: React.FC<RestaurantListItemProps> = ({
                                                                   restaurant,
                                                                   onPress,
                                                                   onToggleFavorite,
                                                               }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // 初始化 isFavorite 状态：优先使用 restaurant.is_favorites，如果不存在，则默认为 false
    const [isFavorite, setIsFavorite] = useState(!!restaurant.is_favorites);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false); // 用于处理异步加载状态

    // 当 restaurant.is_favorites prop 变化时，同步本地 isFavorite 状态
    // 这在列表刷新，父组件重新传入 restaurant 数据时有用
    useEffect(() => {
        setIsFavorite(!!restaurant.is_favorites);
    }, [restaurant.is_favorites]);

    const handleFavoritePress = async () => {
        if (isTogglingFavorite) return; // 防止重复点击

        setIsTogglingFavorite(true);
        const newFavStatus = !isFavorite;

        try {
            if (onToggleFavorite) {
                // 调用父组件传递的 onToggleFavorite，它应该处理 API 调用
                // 并返回一个 Promise，表示操作是否成功
                const success = await onToggleFavorite(restaurant._id, newFavStatus);
                if (success !== false) { // 如果父组件没有明确返回 false (表示失败)
                    setIsFavorite(newFavStatus); // 则更新本地UI状态
                }
                // 如果父组件返回 false，则不更新本地UI，表示操作失败，UI应保持原状
            } else {
                // 如果没有提供 onToggleFavorite，仅切换本地状态 (用于纯展示或测试)
                setIsFavorite(newFavStatus);
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            // 可以在这里添加错误提示，例如 Alert.alert(...)
            // 如果出错，UI 状态不改变
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    const handleItemPress = () => {
        onPress?.(restaurant._id);
    };

    const rating = parseFloat(String(restaurant['店铺总分'] || (typeof restaurant['店铺均分'] === 'object' && restaurant['店铺均分'] !== null ? restaurant['店铺均分']['口味'] : restaurant['店铺均分']) || 0));
    const avgPrice = restaurant['人均价格'] ? `¥${restaurant['人均价格']}` : '价格未知';
    const distance = restaurant.distance_km != null && restaurant.distance_km !== '?' ? `${restaurant.distance_km}km` : '';


    return (
        <TouchableOpacity onPress={handleItemPress} activeOpacity={0.8}>
            <ThemedView style={[styles.container, { shadowColor: colors.textDark, backgroundColor: colors.cardBg }]}>
                <Image
                    source={{ uri: restaurant['图片链接'] || 'https://via.placeholder.com/80x80/E5E7EB/B0B0B0?text=No+Img' }}
                    style={styles.image}
                    onError={() => console.log("Error loading image for:", restaurant['店铺名'])}
                />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <ThemedText type="subtitle" style={styles.name} numberOfLines={1}>
                            {restaurant['店铺名']}
                        </ThemedText>
                        <View style={styles.ratingFavContainer}>
                            <StarRating rating={rating} starSize={14} />
                            <TouchableOpacity
                                onPress={handleFavoritePress}
                                style={styles.favButton}
                                disabled={isTogglingFavorite} // 正在切换时禁用按钮
                            >
                                <AntDesign
                                    name={isFavorite ? "heart" : "hearto"}
                                    size={20}
                                    color={isFavorite ? colors.heartColor : colors.textSubtle} // 使用 textSubtle 作为未选中颜色
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ThemedText style={[styles.infoLine, {color: colors.textSubtle}]} numberOfLines={1}>
                        {restaurant['标签1'] || '餐厅'}
                        <Text style={[styles.separator, {color: colors.textSubtle}]}> | </Text>
                        人均: {avgPrice}
                        {distance ? <><Text style={[styles.separator, {color: colors.textSubtle}]}> | </Text>距离: {distance}</> : ''}
                    </ThemedText>

                    <ThemedText style={[styles.supportingText, {color: colors.textSubtle}]} numberOfLines={1}>
                        {restaurant['推荐菜'] && Array.isArray(restaurant['推荐菜']) && restaurant['推荐菜'].length > 0 && restaurant['推荐菜'][0] !== '-' ? restaurant['推荐菜'][0] : '探索美味佳肴...'}
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
        // backgroundColor 由 themedColors.cardBg 设置
        marginBottom: Layout.spacing.sm + 2,
        ...Layout.shadow.sm,
    },
    image: {
        width: 70,
        height: 70,
        borderRadius: Layout.borderRadius.md,
        backgroundColor: Colors.common.placeholderBg,
        marginRight: Layout.spacing.md,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Layout.spacing.xs,
    },
    name: {
        flex: 1,
        marginRight: Layout.spacing.sm,
        // fontWeight 通过 ThemedText type="subtitle" 设置
    },
    ratingFavContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    favButton: {
        marginLeft: Layout.spacing.sm,
        padding: Layout.spacing.xs / 2,
    },
    infoLine: {
        fontSize: Layout.fontSize.sm - 1,
        marginBottom: Layout.spacing.xs,
    },
    separator: {
        marginHorizontal: Layout.spacing.xs,
        opacity: 0.8, // 分隔符可以稍微不那么显眼
    },
    supportingText: {
        fontSize: Layout.fontSize.sm - 2,
        marginTop: Layout.spacing.xs / 2,
    },
});

export default RestaurantListItem;
