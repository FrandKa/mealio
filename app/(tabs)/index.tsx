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
import { fetchRestaurantsAPI } from '@/services/apiService';
import * as Location from 'expo-location';
import Colors from "@/constants/Colors";

const initialFilterState: AppliedFilters = {
    priceValue: '',
    customMinPrice: '',
    customMaxPrice: '',
    distance: null, // 初始距离筛选为空
    cuisine: '',
    searchTerm: '',
};

const ITEMS_PER_PAGE_RESTAURANTS = 10;

export default function HomeScreen() {
    const rnColorScheme = useRColorScheme();
    const currentColorScheme = rnColorScheme ?? 'light';
    const activeTintColor = Colors[currentColorScheme].tint;

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

    const getLocationAsync = useCallback(async (): Promise<boolean> => {
        console.log("getLocationAsync called");
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setLocationErrorMsg('未授予位置权限。距离筛选将不可用。'); // 更新提示信息
            setIsLocationAvailable(false);
            // Alert.alert("位置权限", "需要位置权限以按距离筛选。请在设置中开启。"); // 可以不强制弹窗
            return false;
        }
        try {
            let currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 5000 });
            console.log("Location fetched:", currentLocation);
            setLocation(currentLocation);
            setIsLocationAvailable(true);
            setLocationErrorMsg(null);
            return true;
        } catch (error: any) {
            console.log("Error fetching location:", error);
            setLocationErrorMsg('无法获取位置: ' + error.message + '。距离筛选可能不准确。'); // 更新提示信息
            setIsLocationAvailable(false); // 即使获取失败，也标记为不可用
            // Alert.alert("获取位置失败", "无法获取当前位置信息，距离筛选可能不可用。"); // 可以不强制弹窗
            return false;
        }
    }, []);

    const loadRestaurants = useCallback(async (
        page: number,
        filters: AppliedFilters,
        actionType: 'initial' | 'loadMore' | 'refresh' | 'filterChange' = 'initial'
    ) => {
        if (actionType === 'loadMore' && isLoadingMore) { console.log("Skipping: Already loading more."); return; }
        if (actionType === 'refresh' && isRefreshing) { console.log("Skipping: Already refreshing."); return; }
        if ((actionType === 'initial' || actionType === 'filterChange') && isLoading && page === 1) {
            console.log(`Skipping: ${actionType} - Main load already in progress.`);
            return;
        }

        console.log(`Executing loadRestaurants. Page: ${page}, Action: ${actionType}, Filters:`, JSON.stringify(filters));

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

        // *** 修改：处理 location 和 distance 参数 ***
        const currentLoc = location; // 从 state 获取最新的 location
        if (currentLoc && isLocationAvailable) { // 只有当位置可用时才传递 location 参数
            params.location = `${currentLoc.coords.longitude},${currentLoc.coords.latitude}`;
            // 只有当用户选择了距离筛选时才传递 distance 参数
            if (filters.distance !== null && filters.distance !== '') {
                const distanceValue = parseFloat(filters.distance);
                if (!isNaN(distanceValue) && distanceValue > 0) {
                    params.distance = distanceValue;
                }
            }
        }
        // **************************************

        try {
            console.log("Calling fetchRestaurantsAPI with params:", params);
            const data = await fetchRestaurantsAPI(params);
            console.log("API Response received, page:", data.page, "total:", data.total);
            setRestaurants(prev => (page === 1 ? data.restaurants : [...prev, ...data.restaurants]));
            setTotalRestaurants(data.total);
            setCurrentPage(data.page);
            if (actionType === 'initial') setInitialLoadDone(true);
        } catch (error: any) {
            console.error("获取餐厅失败:", error);
            Alert.alert("错误", `加载餐厅列表失败: ${error.message}`);
        } finally {
            switch (actionType) {
                case 'loadMore': setIsLoadingMore(false); break;
                case 'refresh': setIsRefreshing(false); break;
                default: setIsLoading(false); break;
            }
            console.log("Finished loadRestaurants. isLoading:", isLoading, "isLoadingMore:", isLoadingMore, "isRefreshing:", isRefreshing);
        }
    }, [location, isLocationAvailable]); // *** 修改：添加 isLocationAvailable 到依赖项 ***

    useEffect(() => {
        console.log("Initial load effect - Mount");
        const performInitialLoad = async () => {
            await getLocationAsync();
            // getLocationAsync 会设置 location state。
            // 初始加载现在依赖于下面的 effect。
        };
        performInitialLoad();
    }, [getLocationAsync]);

    useEffect(() => {
        console.log(
            "Filters/Location effect triggered. Filters:", JSON.stringify(appliedFilters),
            "Location:", location ? `${location.coords.latitude},${location.coords.longitude}` : "N/A",
            "isLocationAvailable:", isLocationAvailable,
            "InitialLoadDone:", initialLoadDone
        );

        const isFiltersInitialComparedToState = JSON.stringify(appliedFilters) === JSON.stringify(initialFilterState);
        console.log('isFiltersInitialComparedToState', isFiltersInitialComparedToState)

        if (!initialLoadDone) {
            // 初始加载条件：
            // 1. 位置已获取 (location !== null && isLocationAvailable)
            // 2. 或者，用户没有选择按距离筛选 (appliedFilters.distance === null)
            //    （即使位置获取失败，只要不按距离筛选，就应该加载）
            if ((location !== null && isLocationAvailable) || appliedFilters.distance === null) {
                console.log("Performing initial data load.");
                loadRestaurants(1, appliedFilters, 'initial');
            } else if (location === null && !isLocationAvailable && appliedFilters.distance !== null) {
                // 位置获取失败，但用户想按距离筛选，可以给提示或不加载
                console.log("Location not available, but distance filter is set. Not loading initially or show error.");
                // setLocationErrorMsg("无法按距离筛选，请检查位置服务。"); // 可以选择在这里设置错误信息
                // setIsLoading(false); // 确保加载状态解除
                // setInitialLoadDone(true); // 标记尝试过初始加载
            }
        } else { // 初始加载已完成后
            if (!isFiltersInitialComparedToState) { // 只有当筛选条件真正被用户改变时
                console.log("isLoading ", isLoading)
                console.log("isLoadingMore ", isLoadingMore)
                console.log("isRefreshing", isRefreshing)
                if (!isLoading && !isLoadingMore && !isRefreshing) {
                    console.log("Filters changed by user, reloading page 1.");
                    loadRestaurants(1, appliedFilters, 'filterChange');
                } else {
                    console.log("Filters changed, but another load is in progress. Skipping.");
                }
            }
        }
    }, [appliedFilters, location, isLocationAvailable, initialLoadDone, loadRestaurants]);


    const handleSearchPress = () => {
        console.log("Search button pressed. Updating appliedFilters with searchTerm:", searchTerm);
        setAppliedFilters(prevFilters => ({ ...prevFilters, searchTerm: searchTerm }));
    };

    const handleApplyFilters = (newFiltersFromModal: AppliedFilters) => {
        console.log("ApplyFilters from modal. Merging with current searchTerm:", searchTerm);
        setIsFilterModalVisible(false);
        // *** 修改：如果位置不可用，但用户尝试按距离筛选，则重置距离筛选 ***
        let filtersToApply = { ...newFiltersFromModal, searchTerm: searchTerm };
        if (!isLocationAvailable && filtersToApply.distance !== null) {
            Alert.alert("提示", "位置服务不可用，距离筛选已重置为“任何距离”。");
            filtersToApply.distance = null; // 重置距离筛选
        }
        setAppliedFilters(filtersToApply);
    };

    const handleRefresh = () => {
        if (!isRefreshing) {
            console.log("Refresh triggered.");
            setCurrentPage(1);
            setInitialLoadDone(false);
            loadRestaurants(1, appliedFilters, 'refresh');
        }
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && restaurants.length < totalRestaurants) {
            console.log("Load more triggered.");
            loadRestaurants(currentPage + 1, appliedFilters, 'loadMore');
        }
    };

    const handleMenuPress = () => console.log('Menu button pressed');
    const handleRestaurantPress = (id: string) => console.log('Restaurant pressed:', id);
    const handleToggleFavorite = (id: string, isFavorite: boolean) => console.log('Fav toggled:', id, isFavorite);

    const getFilterButtonText = () => {
        let count = 0;
        if (appliedFilters.priceValue || appliedFilters.customMinPrice || appliedFilters.customMaxPrice) count++;
        // *** 修改：只有当距离被有效选择时才计数 ***
        if (appliedFilters.distance !== null && appliedFilters.distance !== '') count++;
        if (appliedFilters.cuisine) count++;
        return count > 0 ? `筛选 (${count})` : '筛选';
    };

    const handleSelectCuisineFromMore = (cuisine: Cuisine) => {
        setAppliedFilters(prev => ({ ...prev, cuisine: cuisine.name }));
        setIsMoreCuisinesModalVisible(false);
        setIsFilterModalVisible(true);
    };

    const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
        <RestaurantListItem
            restaurant={item}
            onPress={handleRestaurantPress}
            onToggleFavorite={handleToggleFavorite}
        />
    );

    const renderContent = () => {
        if (isLoading && restaurants.length === 0 && !isRefreshing && !initialLoadDone) {
            return (
                <View style={[styles.container, styles.centered]}>
                    <ActivityIndicator size="large" color={activeTintColor} />
                    <ThemedText style={{ marginTop: Layout.spacing.md }}>正在加载餐厅...</ThemedText>
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
                isLocationAvailable={isLocationAvailable} // 传递给 FilterModal
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
    errorText: {
        marginTop: Layout.spacing.sm,
        color: (Colors.common && Colors.common.danger) || 'red',
        textAlign: 'center',
    }
});
