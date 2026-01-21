// app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    FlatList,
    View,
    Alert,
    ActivityIndicator,
    Text,
    useColorScheme as useRColorScheme, // 重命名以避免与自定义hook冲突
    Image,
    TouchableOpacity,
} from 'react-native';
import AppHeader from '@/components/common/AppHeader';
import BannerSlider from '@/components/common/BannerSlider';
import SectionHeader from '@/components/common/SectionHeader';
import RestaurantListItem from '@/components/common/RestaurantListItem';
import FilterModal from '@/components/filters/FilterModal';
import MoreCuisinesModal from '@/components/filters/MoreCuisinesModal';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Layout from '@/constants/Layout';
import { Restaurant, AppliedFilters, Cuisine, RestaurantApiParams } from '@/types';
import { fetchRestaurantsAPI, addToCartAPI, removeFromCartAPI } from '@/services/apiService'; // 导入购物车API
import * as Location from 'expo-location';
import Colors from "@/constants/Colors";
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import StarRating from '@/components/common/StarRating';
import { useAuth } from '@/constants/AuthContext';
import {random} from "lodash"; // 导入 useAuth

const initialFilterState: AppliedFilters = {
    priceValue: '',
    customMinPrice: '',
    customMaxPrice: '',
    distance: null,
    cuisine: '',
    searchTerm: '',
};

const ITEMS_PER_PAGE_RESTAURANTS = 10;
const ITEMS_PER_PAGE_FEATURED = 10;

// --- 特色餐厅卡片组件 ---
interface FeaturedRestaurantCardProps {
    restaurant: Restaurant;
    onPress: (id: string) => void;
    colors: typeof Colors.light;
}

const FeaturedRestaurantCard: React.FC<FeaturedRestaurantCardProps> = ({ restaurant, onPress, colors }) => {
    const getRatingValue = (res: Restaurant) => {
        return parseFloat(
            String(res['店铺总分'] ||
                (typeof res['店铺均分'] === 'object' && res['店铺均分'] !== null ? res['店铺均分']['口味'] : res['店铺均分']) || 0)
        );
    };

    return (
        <TouchableOpacity onPress={() => onPress(restaurant._id)} style={[featuredStyles.cardContainer, { backgroundColor: colors.cardBg, shadowColor: colors.textDark }]}>
            <Image
                source={{ uri: restaurant['图片链接'] || 'https://via.placeholder.com/150x100/E5E7EB/B0B0B0?text=No+Image' }}
                style={featuredStyles.cardImage}
                resizeMode="cover"
            />
            <View style={featuredStyles.cardTextContainer}>
                <ThemedText type="defaultSemiBold" style={featuredStyles.cardTitle} numberOfLines={1}>
                    {restaurant['店铺名']}
                </ThemedText>
                {restaurant['人均价格'] && (
                    <View style={featuredStyles.cardRow}>
                        <FontAwesome5 name="money-bill-wave" size={12} color={colors.textSubtle} style={featuredStyles.cardIcon} />
                        <ThemedText style={[featuredStyles.cardInfo, { color: colors.textSubtle }]}>
                            人均 ¥{restaurant['人均价格']}
                        </ThemedText>
                    </View>
                )}
                <View style={featuredStyles.cardRow}>
                    <StarRating rating={getRatingValue(restaurant)} starSize={14} />
                    {restaurant['评论总数'] && (
                        <ThemedText style={[featuredStyles.cardReviews, { color: colors.textSubtle }]}>
                            ({restaurant['评论总数']})
                        </ThemedText>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};
// --- 结束特色餐厅卡片组件 ---


export default function HomeScreen() {
    const rnColorScheme = useRColorScheme();
    const currentColorScheme = rnColorScheme ?? 'light';
    const colors = Colors[currentColorScheme];
    const activeTintColor = colors.tint;
    const router = useRouter();
    const { getAuthTokenFromStore, signOut, session, fetchCartCount } = useAuth(); // 获取 session 和 fetchCartCount

    const [searchTerm, setSearchTerm] = useState('');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRestaurants, setTotalRestaurants] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(initialFilterState);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [isLocationAvailable, setIsLocationAvailable] = useState(false);
    const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);

    const [isMoreCuisinesModalVisible, setIsMoreCuisinesModalVisible] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    const [featuredRestaurants, setFeaturedRestaurants] = useState<Restaurant[]>([]);
    const [isLoadingFeatured, setIsLoadingFeatured] = useState(false);

    const getLocationAsync = useCallback(async (): Promise<boolean> => {
        console.log("getLocationAsync called");
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setLocationErrorMsg('未授予位置权限。距离筛选将不可用。');
            setIsLocationAvailable(false);
            return false;
        }
        try {
            let currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 5000 });
            setLocation(currentLocation);
            setIsLocationAvailable(true);
            setLocationErrorMsg(null);
            return true;
        } catch (error: any) {
            setLocationErrorMsg('无法获取位置: ' + error.message + '。距离筛选可能不准确。');
            setIsLocationAvailable(false);
            return false;
        }
    }, []);

    const loadRestaurants = useCallback(async (
        page: number,
        filters: AppliedFilters,
        actionType: 'initial' | 'loadMore' | 'refresh' | 'filterChange' = 'initial'
    ) => {
        if (!session && actionType !== 'initial' && page > 1) { // 对于非初始加载，如果未登录则不继续
            console.log("User not logged in, aborting non-initial restaurant load.");
            setIsLoadingMore(false);
            setIsRefreshing(false);
            return;
        }
        if (actionType === 'loadMore' && isLoadingMore) return;
        if (actionType === 'refresh' && isRefreshing) return;
        if ((actionType === 'initial' || actionType === 'filterChange') && isLoading && page === 1) return;

        switch (actionType) {
            case 'loadMore': setIsLoadingMore(true); break;
            case 'refresh': setIsRefreshing(true); break;
            default: setIsLoading(true); break;
        }
        const params: RestaurantApiParams = { page, per_page: ITEMS_PER_PAGE_RESTAURANTS };
        if (filters.searchTerm) params.name = filters.searchTerm;
        if (filters.cuisine) params.keyword = filters.cuisine;
        if (filters.priceValue === 'custom') {
            if (filters.customMinPrice) params.min_price = parseFloat(filters.customMinPrice);
            if (filters.customMaxPrice) params.max_price = parseFloat(filters.customMaxPrice);
        } else if (filters.priceValue) {
            const parts = filters.priceValue.split('-');
            if (parts.length === 1 && filters.priceValue.endsWith('+')) params.min_price = parseFloat(parts[0]);
            else if (parts.length === 2) { params.min_price = parseFloat(parts[0]); params.max_price = parseFloat(parts[1]); }
        }
        const currentLoc = location;
        if (currentLoc && isLocationAvailable) {
            params.location = `${currentLoc.coords.longitude},${currentLoc.coords.latitude}`;
            if (filters.distance !== null && filters.distance !== '') {
                const distanceValue = parseFloat(filters.distance);
                if (!isNaN(distanceValue) && distanceValue > 0) params.distance = distanceValue;
            }
        }
        try {
            const data = await fetchRestaurantsAPI(params); // fetchRestaurantsAPI 现在需要 token
            // 假设 fetchRestaurantsAPI 返回的 Restaurant[] 包含 is_favorites 字段 (如果用户登录)
            setRestaurants(prev => (page === 1 ? data.restaurants : [...prev, ...data.restaurants]));
            console.log(data.restaurants[0].is_favorites)
            setTotalRestaurants(data.total);
            setCurrentPage(data.page);
            if (actionType === 'initial') setInitialLoadDone(true);
        } catch (error: any) {
            console.error("加载餐厅列表失败:", error.status);
            Alert.alert("错误", `加载餐厅列表失败: ${error.message}`);
            await signOut()
        } finally {
            switch (actionType) {
                case 'loadMore': setIsLoadingMore(false); break;
                case 'refresh': setIsRefreshing(false); break;
                default: setIsLoading(false); break;
            }
        }
    }, [location, isLocationAvailable, isLoading, isLoadingMore, isRefreshing, session]);


    useEffect(() => { // 加载特色餐厅
        const loadFeaturedRestaurants = async () => {
            if (!session && ITEMS_PER_PAGE_FEATURED > 0) {
                // 如果未登录，可以决定是否加载特色餐厅，或者加载一个公共的特色列表
                // 为简单起见，如果 fetchRestaurantsAPI 需要 token，这里会失败或返回空
                // setFeaturedRestaurants([]); setIsLoadingFeatured(false);
                // return;
            }
            setIsLoadingFeatured(true);
            try {
                const params: RestaurantApiParams = { page: 1, per_page: ITEMS_PER_PAGE_FEATURED };
                const data = await fetchRestaurantsAPI(params);
                // 假设 fetchRestaurantsAPI 返回的 Restaurant[] 包含 is_favorites 字段
                setFeaturedRestaurants(data.restaurants);
            } catch (error) {
                console.error("获取特色餐厅失败:", error);
            } finally {
                setIsLoadingFeatured(false);
            }
        };
        if (ITEMS_PER_PAGE_FEATURED > 0) {
            loadFeaturedRestaurants();
        }
    }, [session, isLocationAvailable]); // location 变化时，特色餐厅不一定需要重载，除非它们是基于位置的

    useEffect(() => {
        console.log("Initial load effect - Mount");
        const performInitialLoad = async () => {
            await getLocationAsync();
        };
        performInitialLoad();
    }, [getLocationAsync]);

    useEffect(() => {
        const isFiltersInitialComparedToState = JSON.stringify(appliedFilters) === JSON.stringify(initialFilterState);
        if (!initialLoadDone) {
            if ((location !== null && isLocationAvailable) || appliedFilters.distance === null) {
                loadRestaurants(1, appliedFilters, 'initial');
            }
        } else {
            console.log("filter change")
            if (!isFiltersInitialComparedToState) {
                if (!isLoading && !isLoadingMore && !isRefreshing) {
                    loadRestaurants(1, appliedFilters, 'filterChange');
                }
            }
        }
    }, [appliedFilters, location, isLocationAvailable, initialLoadDone, loadRestaurants, session, useAuth().isLoading]);


    const handleSearchPress = () => {
        setAppliedFilters(prevFilters => ({ ...prevFilters, searchTerm: searchTerm }));
    };

    const handleApplyFilters = (newFiltersFromModal: AppliedFilters) => {
        setIsFilterModalVisible(false);
        let filtersToApply = { ...newFiltersFromModal, searchTerm: searchTerm };
        if (!isLocationAvailable && filtersToApply.distance !== null) {
            Alert.alert("提示", "位置服务不可用，距离筛选已重置为“任何距离”。");
            filtersToApply.distance = null;
        }
        setAppliedFilters(filtersToApply);
    };

    const handleRefresh = () => {
        if (!isRefreshing) {
            console.log("User triggered refresh.");
            setCurrentPage(1); // 重置页码
            // setInitialLoadDone(false); // 标记需要重新进行“初始”加载（或刷新加载）
            loadRestaurants(1, appliedFilters, 'refresh'); // 调用刷新

            // 刷新特色餐厅
            if (ITEMS_PER_PAGE_FEATURED > 0 && session) {
                const loadFeatured = async () => {
                    setIsLoadingFeatured(true);
                    try {
                        const params: RestaurantApiParams = { page: 1, per_page: ITEMS_PER_PAGE_FEATURED };
                        const data = await fetchRestaurantsAPI(params, session);
                        setFeaturedRestaurants(data.restaurants.map(r => ({...r, is_favorites: !!r.is_favorites })));
                    } catch (error) { console.error("刷新特色餐厅失败:", error); }
                    finally { setIsLoadingFeatured(false); }
                };
                loadFeatured();
            }
        }
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && restaurants.length < totalRestaurants) {
            loadRestaurants(currentPage + 1, appliedFilters, 'loadMore');
        }
    };

    const handleMenuPress = () => console.log('Menu button pressed');

    const handleRestaurantPress = (id: string) => {
        console.log("router push")
        router.push({ pathname: '/detail', params: { id } });
    };

    const getFilterButtonText = () => {
        let count = 0;
        if (appliedFilters.priceValue || appliedFilters.customMinPrice || appliedFilters.customMaxPrice) count++;
        if (appliedFilters.distance !== null && appliedFilters.distance !== '') count++;
        if (appliedFilters.cuisine) count++;
        return count > 0 ? `筛选 (${count})` : '筛选';
    };

    const handleSelectCuisineFromMore = (cuisine: Cuisine) => {
        setAppliedFilters(prev => ({ ...prev, cuisine: cuisine.name }));
        setIsMoreCuisinesModalVisible(false);
        setIsFilterModalVisible(true);
    };

    // --- 修改 handleToggleFavorite ---
    const handleToggleFavorite = async (restaurantId: string, currentIsFavoriteState: boolean): Promise<boolean> => {
        if (!session) {
            Alert.alert("请先登录", "登录后才能将餐厅加入购物车。");
            return false;
        }
        const shouldBeInCart = !currentIsFavoriteState;

        try {
            if (shouldBeInCart) {
                await addToCartAPI(restaurantId);
                Alert.alert("成功", "已添加到购物车！");
            } else {
                await removeFromCartAPI(restaurantId);
                Alert.alert("成功", "已从购物车移除。");
            }

            // 更新主餐厅列表
            setRestaurants(prev =>
                prev.map(r =>
                    r._id === restaurantId ? { ...r, is_favorites: shouldBeInCart } : r
                )
            );
            // 更新特色餐厅列表
            setFeaturedRestaurants(prev =>
                prev.map(r =>
                    r._id === restaurantId ? { ...r, is_favorites: shouldBeInCart } : r
                )
            );

            await fetchCartCount(); // 更新底部导航角标
            return true; // 操作成功
        } catch (error: any) {
            console.error("Toggle favorite error:", error);
            Alert.alert("操作失败", error.message || (shouldBeInCart ? "添加到购物车失败" : "从购物车移除失败"));
            return false; // 操作失败
        }
    };
    // --- 结束修改 handleToggleFavorite ---

    const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
        <RestaurantListItem
            restaurant={item} // item 中应包含 is_favorites 状态
            onPress={handleRestaurantPress}
            // 传递当前 item 的 is_favorites 状态给 handleToggleFavorite
            onToggleFavorite={() => handleToggleFavorite(item._id, !!item.is_favorites)}
        />
    );

    const renderContent = () => {
        if (isLoading && restaurants.length === 0 && !isRefreshing && !initialLoadDone && featuredRestaurants.length === 0) {
            return (
                <View style={[styles.container, styles.centered]}>
                    <ActivityIndicator size="large" color={activeTintColor} />
                    <ThemedText style={{ marginTop: Layout.spacing.md }}>正在加载...</ThemedText>
                </View>
            );
        }
        return (
            <FlatList
                data={restaurants}
                renderItem={renderRestaurantItem}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={(
                    <>
                        <BannerSlider />
                        {isLoadingFeatured && featuredRestaurants.length === 0 ? (
                            <ActivityIndicator size="small" color={activeTintColor} style={{ marginVertical: Layout.spacing.md }}/>
                        ) : featuredRestaurants.length > 0 ? (
                            <View>
                                <ThemedText type="title" style={styles.title}>热门推荐</ThemedText>
                                <FlatList
                                    horizontal
                                    data={featuredRestaurants}
                                    renderItem={({ item }) => (
                                        <FeaturedRestaurantCard // 特色餐厅卡片通常不直接包含收藏按钮
                                            restaurant={item}
                                            onPress={handleRestaurantPress}
                                            colors={colors}
                                        />
                                    )}
                                    keyExtractor={(item) => `featured-${item._id}`}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={featuredStyles.horizontalListContent}
                                />
                            </View>
                        ) : null}
                        <SectionHeader
                            title="附近的餐厅"
                            filterText={getFilterButtonText()}
                            onFilterPress={() => setIsFilterModalVisible(true)}
                        />
                    </>
                )}
                ListEmptyComponent={
                    !isLoading && !isRefreshing && initialLoadDone ? (
                        <View style={styles.emptyListContainer}>
                            <ThemedText type="subtitle">找不到符合条件的餐厅</ThemedText>
                            {locationErrorMsg && <Text style={styles.errorText}>{locationErrorMsg}</Text>}
                        </View>
                    ) : null
                }
                ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color={activeTintColor} style={{ marginVertical: Layout.spacing.md }}/> : null}
                contentContainerStyle={styles.listContentContainer}
                showsVerticalScrollIndicator={false}
                onRefresh={handleRefresh}
                refreshing={isRefreshing}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
            />
        );
    };

    return (
        <ThemedView style={styles.container}>
            <AppHeader
                onMenuPress={handleMenuPress}
                onSearchPress={handleSearchPress}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
            />
            {renderContent()}
            <FilterModal
                isVisible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                onApplyFilters={handleApplyFilters}
                initialFilters={appliedFilters}
                isLocationAvailable={isLocationAvailable}
                onMoreCuisinesPress={() => {
                    setIsFilterModalVisible(false);
                    setIsMoreCuisinesModalVisible(true);
                }}
            />
            <MoreCuisinesModal
                isVisible={isMoreCuisinesModalVisible}
                onClose={() => {
                    setIsMoreCuisinesModalVisible(false);
                }}
                onCuisineSelect={handleSelectCuisineFromMore}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContentContainer: {
        paddingHorizontal: Layout.spacing.page,
        paddingBottom: Layout.spacing.xl + (Layout.bottomNavHeight || 60),
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Layout.spacing.lg,
        minHeight: 200,
    },
    title: {
        marginTop: 21,
        marginLeft: Layout.spacing.md
    },
    errorText: {
        marginTop: Layout.spacing.sm,
        color: (Colors.common && Colors.common.danger) || 'red',
        textAlign: 'center',
    }
});

const featuredStyles = StyleSheet.create({
    horizontalListContent: {
        paddingVertical: Layout.spacing.md,
        paddingLeft: Layout.spacing.page,
        paddingRight: Layout.spacing.xs,
    },
    cardContainer: {
        width: 220,
        marginRight: Layout.spacing.md,
        borderRadius: Layout.borderRadius.lg,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: 120,
    },
    cardTextContainer: {
        padding: Layout.spacing.sm,
    },
    cardTitle: {
        fontSize: Layout.fontSize.md,
        marginBottom: Layout.spacing.xs,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Layout.spacing.xxs + 1,
    },
    cardIcon: {
        marginRight: Layout.spacing.xs,
    },
    cardInfo: {
        fontSize: Layout.fontSize.sm,
    },
    cardReviews: {
        fontSize: Layout.fontSize.xs,
        marginLeft: Layout.spacing.xs,
    },
});
