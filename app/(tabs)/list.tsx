// app/(tabs)/list.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    FlatList,
    View,
    Alert,
    ActivityIndicator,
    Text,
    TouchableOpacity,
    RefreshControl,
    Platform,
    Dimensions, // 确保 Dimensions 已导入
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; // 导入 useFocusEffect
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import RestaurantListItem from '@/components/common/RestaurantListItem'; // 确保路径正确
import Layout from '@/constants/Layout';
import { Restaurant } from '@/types'; // 移除了未使用的 RestaurantApiParams
import { fetchCartAPI, removeFromCartAPI, clearCartAPI, fetchRestaurantsAPI } from '@/services/apiService'; // 导入购物车API
import { useAuth } from '@/constants/AuthContext'; // 导入 AuthContext
import Colors from "@/constants/Colors";
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { height: screenHeight } = Dimensions.get('window');
const ITEMS_PER_PAGE = 10;

export default function CartScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const themedColors = Colors[colorScheme];
    const { session, fetchCartCount, user } = useAuth();

    const [cartItems, setCartItems] = useState<Restaurant[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false); // 用于首次加载或手动刷新时的全屏/主要加载指示
    const [isLoadingMore, setIsLoadingMore] = useState(false); // 用于上拉加载更多
    const [isRefreshing, setIsRefreshing] = useState(false); // 由 RefreshControl 控制
    const [error, setError] = useState<string | null>(null);

    // loadCartItems 现在不依赖于它自己设置的 loading states
    const loadCartItems = useCallback(async (page: number, isRefreshOperation = false) => {
        if (!session) {
            setCartItems([]);
            setCurrentPage(1);
            setTotalPages(1);
            setIsLoading(false); // 确保各种loading状态都关闭
            setIsLoadingMore(false);
            setIsRefreshing(false);
            // fetchCartCount(); // 确保角标也更新为0
            return;
        }

        // 防止在加载更多或刷新时重复触发
        if (page > 1 && isLoadingMore) return;
        if (isRefreshOperation && isRefreshing) return;
        // 如果是初始加载 (page 1, 非手动刷新) 且正在加载中，也跳过
        if (page === 1 && !isRefreshOperation && isLoading) return;


        if (page === 1 && !isRefreshOperation) setIsLoading(true);
        else if (isRefreshOperation) setIsRefreshing(true);
        else setIsLoadingMore(true);

        setError(null);
        try {
            console.log(`Fetching cart items - Page: ${page}, Refresh: ${isRefreshOperation}`);
            const data = await fetchCartAPI(page, ITEMS_PER_PAGE);
            if (page === 1) {
                setCartItems(data.restaurants);
            } else {
                setCartItems(prevItems => [...prevItems, ...data.restaurants]);
            }
            setCurrentPage(data.page);
            setTotalPages(data.totalPages || 1);
            await fetchCartCount();
        } catch (err: any) {
            console.error("获取购物车列表失败:", err);
            setError(err.message || "加载购物车失败");
            if (page === 1) setCartItems([]);
        } finally {
            if (page === 1 && !isRefreshOperation) setIsLoading(false);
            if (isRefreshOperation) setIsRefreshing(false);
            if (page > 1) setIsLoadingMore(false);
        }
    }, [session, fetchCartCount]); // 主要依赖 session 和 fetchCartCount

    // 使用 useFocusEffect 在屏幕获得焦点时加载数据
    useFocusEffect(
        useCallback(() => {
            console.log("CartScreen focused.");
            if (session) {
                console.log("Session active, loading initial cart items (page 1).");
                loadCartItems(1, false); // 每次进入页面都加载第一页数据
            } else {
                console.log("No session, clearing cart items.");
                setCartItems([]);
                setCurrentPage(1);
                setTotalPages(1);
                fetchCartCount(); // 清空角标
            }
            return () => {
                console.log("CartScreen unfocused.");
                // 可选的清理操作
            };
        }, [session, loadCartItems, fetchCartCount]) // loadCartItems 现在是稳定的，除非 session 或 fetchCartCount 改变
    );

    const handleRefresh = useCallback(() => {
        console.log("User triggered refresh.");
        loadCartItems(1, true); // 标记为手动刷新操作
    }, [loadCartItems]);

    const handleLoadMore = () => {
        if (!isLoadingMore && !isRefreshing && currentPage < totalPages) {
            console.log("Loading more cart items...");
            loadCartItems(currentPage + 1);
        }
    };

    const handleRemoveFromCart = async (restaurantId: string): Promise<boolean> => {
        try {
            await removeFromCartAPI(restaurantId);
            setCartItems(prevItems => prevItems.filter(item => item._id !== restaurantId));
            await fetchCartCount();
            Alert.alert("成功", "已从购物车移除。");
            return true;
        } catch (err: any) {
            Alert.alert("移除失败", err.message || "从购物车移除商品失败。");
            return false;
        }
    };

    const handleClearCart = async () => {
        Alert.alert(
            "清空购物车",
            "您确定要清空购物车中的所有商品吗？",
            [
                { text: "取消", style: "cancel" },
                {
                    text: "确定清空",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await clearCartAPI();
                            setCartItems([]);
                            setCurrentPage(1);
                            setTotalPages(1);
                            await fetchCartCount();
                            Alert.alert("成功", "购物车已清空。");
                        } catch (err: any) {
                            Alert.alert("操作失败", err.message || "清空购物车失败。");
                        }
                    },
                },
            ]
        );
    };

    const handleRestaurantPress = (id: string) => {
        router.push({ pathname: '/detail', params: { id } });
    };

    const handlePickRandomRestaurant = async () => {
        if (!user || !session) {
            Alert.alert("提示", "请先登录以使用此功能。");
            return;
        }
        const currentLoadingState = isLoading || isLoadingMore || isRefreshing;
        if (currentLoadingState) return; // 如果正在加载，则不执行

        setIsLoading(true); // 使用主 isLoading 来表示正在“挑选”
        try {
            const data = await fetchRestaurantsAPI({ page: 1, per_page: 20 });
            if (data.restaurants && data.restaurants.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.restaurants.length);
                const randomRestaurant = data.restaurants[randomIndex];
                Alert.alert("为你推荐", `试试这家餐厅：${randomRestaurant['店铺名']}？`, [
                    {text: "不了，谢谢"},
                    {text: "查看详情", onPress: () => handleRestaurantPress(randomRestaurant._id)}
                ]);
            } else {
                Alert.alert("抱歉", "暂时没有可推荐的餐厅。");
            }
        } catch (error: any) {
            Alert.alert("出错了", error.message || "获取推荐餐厅失败。");
        } finally {
            setIsLoading(false);
        }
    };


    const renderHeader = () => (
        <Animated.View entering={FadeInDown.duration(500)} style={styles.headerContainer}>
            <ThemedText type="titleL" style={styles.headerTitle}>我的购物车</ThemedText>
            {cartItems.length > 0 && (
                <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
                    <Ionicons name="trash-outline" size={22} color={Colors.common.danger} />
                    <Text style={[styles.clearButtonText, { color: Colors.common.danger }]}>清空</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );

    const renderEmptyComponent = () => (
        <Animated.View entering={FadeInUp.delay(300)} style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color={themedColors.textSubtle} />
            <ThemedText type="subtitle" style={{ marginTop: Layout.spacing.md, color: themedColors.textSubtle }}>
                购物车还是空的
            </ThemedText>
            <ThemedText style={{ marginTop: Layout.spacing.xs, color: themedColors.textSubtle, textAlign: 'center' }}>
                去发现一些美味吧！
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={styles.browseButton}>
                <Text style={styles.browseButtonText}>去逛逛</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderFooter = () => (
        cartItems.length > 0 ? (
            <Animated.View entering={FadeInUp.delay(200)} style={styles.bookingMoreContainer}>
                <TouchableOpacity style={[styles.bookingMoreButton, {borderColor: themedColors.primary}]} onPress={() => router.push('/(tabs)/')}>
                    <Ionicons name="add" size={24} color={themedColors.primary} style={{marginRight: Layout.spacing.xs}}/>
                    <Text style={[styles.bookingMoreText, {color: themedColors.primary}]}>继续点单</Text>
                </TouchableOpacity>
            </Animated.View>
        ) : null
    );

    // 初始加载时，如果 cartItems 为空且 !isRefreshing，显示全屏加载
    if (isLoading && cartItems.length === 0 && !isRefreshing) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themedColors.tint} />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.outerContainer, { backgroundColor: themedColors.background }]}>
            <FlatList
                data={cartItems}
                renderItem={({ item }) => (
                    <RestaurantListItem
                        restaurant={{ ...item, is_favorites: true }}
                        onPress={handleRestaurantPress}
                        onToggleFavorite={handleRemoveFromCart}
                    />
                )}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={(!isLoading && !isRefreshing) ? renderEmptyComponent : null} // 仅在非加载和非刷新时显示空状态
                ListFooterComponent={
                    <>
                        {isLoadingMore && <ActivityIndicator size="small" color={themedColors.tint} style={{ marginVertical: Layout.spacing.md }} />}
                        {renderFooter()}
                    </>
                }
                contentContainerStyle={styles.listContentContainer}
                onRefresh={handleRefresh}
                refreshing={isRefreshing}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
            />

            <Animated.View entering={FadeInUp.delay(800)} style={[styles.randomPickButtonContainer, { bottom: (Layout.bottomNavHeight || 60) + Layout.spacing.md }]}>
                <TouchableOpacity
                    style={[styles.randomPickButton, { backgroundColor: themedColors.tint }]}
                    onPress={handlePickRandomRestaurant}
                    disabled={isLoading || isLoadingMore || isRefreshing}
                >
                    <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={Colors.common.white} style={{marginRight: Layout.spacing.sm}}/>
                    <Text style={[styles.randomPickButtonText, { color: Colors.common.white }]}>随机来一份</Text>
                </TouchableOpacity>
            </Animated.View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        paddingTop: (Platform.OS === 'android' ? Layout.spacing.md : Layout.spacing.sm) + Layout.spacing.sm,
        paddingBottom: Layout.spacing.md,
        paddingHorizontal: Layout.spacing.page,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontWeight: Layout.fontWeight.bold,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Layout.spacing.xs,
        paddingHorizontal: Layout.spacing.sm,
        borderRadius: Layout.borderRadius.sm,
    },
    clearButtonText: {
        marginLeft: Layout.spacing.xs,
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.medium,
    },
    listContentContainer: {
        paddingHorizontal: Layout.spacing.page,
        paddingTop: Layout.spacing.sm,
        paddingBottom: Layout.spacing.xxl * 2.5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Layout.spacing.xl,
        minHeight: screenHeight / 2,
    },
    browseButton: {
        marginTop: Layout.spacing.lg,
        paddingVertical: Layout.spacing.sm,
        paddingHorizontal: Layout.spacing.xl,
        backgroundColor: Colors.light.tint,
        borderRadius: Layout.borderRadius.pill,
    },
    browseButtonText: {
        color: Colors.common.white,
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.semibold,
    },
    bookingMoreContainer: {
        alignItems: 'center',
        paddingVertical: Layout.spacing.lg,
    },
    bookingMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Layout.spacing.md,
        paddingHorizontal: Layout.spacing.xl,
        borderRadius: Layout.borderRadius.pill,
        borderWidth: 1.5,
    },
    bookingMoreText: {
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.medium,
    },
    randomPickButtonContainer: {
        position: 'absolute',
        left: Layout.spacing.page,
        right: Layout.spacing.page,
        alignItems: 'center',
    },
    randomPickButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Layout.spacing.md,
        paddingHorizontal: Layout.spacing.xl,
        borderRadius: Layout.borderRadius.pill,
        ...Layout.shadow.md,
        elevation: 6,
        minWidth: '70%',
        alignSelf: 'center',
    },
    randomPickButtonText: {
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.semibold,
    },
});
