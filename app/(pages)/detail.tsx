// app/detail.tsx (或者你实际的文件路径)
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
    FlatList,
    Text as RNText,
    Platform, Dimensions, // 导入 Platform
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useNavigation } from 'expo-router'; // useNavigation 用于自定义头部返回
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from '@expo/vector-icons'; // AntDesign for heart

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import StarRating from '@/components/common/StarRating';
import RestaurantListItem from '@/components/common/RestaurantListItem'; // 用于“更多餐厅”
import SectionHeader from '@/components/common/SectionHeader';

import { Restaurant } from '@/types';
import {
    fetchRestaurantDetailAPI,
    fetchRestaurantsAPI,
    addToCartAPI, // 导入购物车API
    removeFromCartAPI,
    checkInCartAPI
} from '@/services/apiService';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Location from 'expo-location';
import { useAuth } from '@/constants/AuthContext'; // 导入 useAuth

const ITEMS_PER_PAGE_OTHER_RESTAURANTS = 3;

export default function RestaurantDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const navigation = useNavigation();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const activeTintColor = colors.tint;
    const { session, fetchCartCount } = useAuth();

    const lightPurpleBackground = colors.lightPurpleBackground || (colorScheme === 'light' ? '#EDE9FE' : '#37304A');
    const purpleTagText = colors.purpleTagText || (colorScheme === 'light' ? '#5B21B6' : '#D8B4FE');
    const tagBorderColor = colors.tagBorder || (colorScheme === 'light' ? '#C4B5FD' : '#5B21B6');

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [otherRestaurants, setOtherRestaurants] = useState<Restaurant[]>([]);
    const [isLoadingOther, setIsLoadingOther] = useState(false);

    const [currentUserLocation, setCurrentUserLocation] = useState<Location.LocationObject | null>(null);
    const [isFavorite, setIsFavorite] = useState(false); // 当前主餐厅的收藏状态
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false); // 主餐厅收藏按钮的加载状态
    const [isTogglingBottomFavorite, setIsTogglingBottomFavorite] = useState(false); // 底部按钮的加载状态


    const getLocationAsync = useCallback(async () => {
        console.log("getLocationAsync Detail: Requesting permissions...");
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.warn('getLocationAsync Detail: Location permission not granted.');
            Alert.alert("权限提示", "我们需要位置权限来显示附近信息，请在设置中开启。");
            return null;
        }
        try {
            console.log("getLocationAsync Detail: Attempting getLastKnownPositionAsync...");
            const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 1000 * 60 * 2 });
            if (lastKnown) {
                console.log("getLocationAsync Detail: Using last known position.", lastKnown.coords);
                return lastKnown;
            }
            console.log("getLocationAsync Detail: Last known not suitable. Fetching current (Balanced, 8s)...");
            const currentPosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 8000 });
            console.log("getLocationAsync Detail: Current position (Balanced).", currentPosition.coords);
            return currentPosition;
        } catch (e: any) {
            console.warn(`getLocationAsync Detail: Failed (Balanced). Error: ${e.message}. Retrying (Low, 5s)...`);
            try {
                const lowAccuracyPosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low, timeout: 5000 });
                console.log("getLocationAsync Detail: Current position (Low).", lowAccuracyPosition.coords);
                return lowAccuracyPosition;
            } catch (e2: any) {
                console.error('getLocationAsync Detail: Failed (Low).', e2.message);
                Alert.alert("定位失败", "无法获取您的当前位置信息。");
                return null;
            }
        }
    }, []);

    useEffect(() => {
        if (!id) {
            setError("餐厅 ID 缺失。");
            setIsLoading(false);
            return;
        }
        const loadDetail = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const locationResult = await getLocationAsync(); // 先获取位置
                setCurrentUserLocation(locationResult);
                const locationString = locationResult ? `${locationResult.coords.longitude},${locationResult.coords.latitude}` : undefined;

                const data = await fetchRestaurantDetailAPI(id, locationString);
                setRestaurant(data);

                if (session && data?._id) {
                    const cartStatus = await checkInCartAPI(data._id);
                    setIsFavorite(cartStatus.in_cart);
                    setRestaurant(prev => prev ? { ...prev, is_favorites: cartStatus.in_cart } : null);
                } else {
                    setIsFavorite(false);
                }
            } catch (err: any) {
                setError(err.message || "无法加载餐厅详情。");
            } finally {
                setIsLoading(false);
            }
        };
        loadDetail();
    }, [id, session, getLocationAsync]); // 移除 getLocationAsync 作为依赖，因为它已用 useCallback 包裹

    useEffect(() => {
        if (!restaurant || !id) return;
        const loadOtherRestaurants = async () => {
            setIsLoadingOther(true);
            try {
                // 对于“其他餐厅”，位置信息是可选的，如果 currentUserLocation 未获取到，则不传递
                const locationString = currentUserLocation ? `${currentUserLocation.coords.longitude},${currentUserLocation.coords.latitude}` : undefined;
                const params = {
                    page: 1,
                    per_page: ITEMS_PER_PAGE_OTHER_RESTAURANTS + 1,
                    location: locationString,
                };
                const data = await fetchRestaurantsAPI(params);
                const filteredOthers = data.restaurants.filter(r => r._id !== id).slice(0, ITEMS_PER_PAGE_OTHER_RESTAURANTS);
                setOtherRestaurants(filteredOthers);
            } catch (err: any) {
                console.error("获取其他餐厅失败:", err);
            } finally {
                setIsLoadingOther(false);
            }
        };
        loadOtherRestaurants();
    }, [restaurant, currentUserLocation, id]);

    // 用于头部收藏按钮和底部收藏按钮的通用逻辑
    const toggleFavoriteStatus = async (restaurantId: string, currentStatus: boolean, setLoadingState: React.Dispatch<React.SetStateAction<boolean>>) => {
        if (!session) {
            Alert.alert("请先登录", "登录后才能操作购物车。");
            return false;
        }
        setLoadingState(true);
        const newFavStatus = !currentStatus;
        try {
            if (newFavStatus) {
                await addToCartAPI(restaurantId);
                Alert.alert("成功", "已添加到购物车！");
            } else {
                await removeFromCartAPI(restaurantId);
                Alert.alert("成功", "已从购物车移除。");
            }
            // 如果是主餐厅，更新主餐厅状态
            if (restaurantId === restaurant?._id) {
                setIsFavorite(newFavStatus);
                setRestaurant(prev => prev ? { ...prev, is_favorites: newFavStatus } : null);
            }
            // 更新 "otherRestaurants" 列表中的对应项
            setOtherRestaurants(prev =>
                prev.map(r => r._id === restaurantId ? { ...r, is_favorites: newFavStatus } : r)
            );
            await fetchCartCount();
            return true;
        } catch (error: any) {
            Alert.alert("操作失败", error.message || (newFavStatus ? "添加到购物车失败" : "从购物车移除失败"));
            return false;
        } finally {
            setLoadingState(false);
        }
    };

    // 头部收藏按钮的 handler
    const handleToggleFavoriteHeader = () => {
        if (restaurant?._id) {
            toggleFavoriteStatus(restaurant._id, isFavorite, setIsTogglingFavorite);
        }
    };

    // 底部按钮的 handler (之前是 handleBookTable)
    const handleToggleFavoriteBottomButton = () => {
        if (restaurant?._id) {
            toggleFavoriteStatus(restaurant._id, isFavorite, setIsTogglingBottomFavorite);
        }
    };

    // "更多餐厅" 列表项的收藏按钮 handler
    const handleToggleFavoriteForOtherRestaurant = (otherRestaurantId: string, currentStatus: boolean) => {
        // 对于 "更多餐厅" 列表，我们不单独管理其 loading state，直接调用通用函数
        // 也可以为其创建单独的 loading state if needed
        toggleFavoriteStatus(otherRestaurantId, currentStatus, (isLoading) => { /* Optional: handle loading for specific item */ });
    };


    const handleVisitRestaurantSite = () => {
        if (restaurant && restaurant['详情链接']) {
            Linking.openURL(restaurant['详情链接']).catch(err =>
                Alert.alert("Error", "Could not open the link.")
            );
        } else {
            Alert.alert("Not available", "No website link provided for this restaurant.");
        }
    };

    const handleRestaurantPressOther = (otherId: string) => {
        // 使用 push 而不是 replace，以便用户可以返回到之前的详情页
        // 同时，为了确保新的详情页重新加载数据，我们传递一个变化的 key 或者直接依赖 id 变化
        router.push({ pathname: '/detail', params: { id: otherId } });
    };

    useEffect(() => {
        if (navigation && restaurant) {
            navigation.setOptions({
                title: restaurant['店铺名'] || '详情',
                headerRight: () => (
                    <TouchableOpacity onPress={handleToggleFavoriteHeader} disabled={isTogglingFavorite} style={{ marginRight: Layout.spacing.md }}>
                        {isTogglingFavorite ? (
                            <ActivityIndicator size="small" color={Platform.OS === 'ios' ? colors.tint : Colors.common.white} />
                        ) : (
                            <AntDesign
                                name={isFavorite ? "heart" : "hearto"}
                                size={24}
                                color={isFavorite ? colors.heartColor : (Platform.OS === 'ios' ? colors.tint : Colors.common.white)}
                            />
                        )}
                    </TouchableOpacity>
                ),
            });
        }
    }, [navigation, restaurant, isFavorite, isTogglingFavorite, colors, colorScheme, handleToggleFavoriteHeader]); // 添加 handleToggleFavoriteHeader


    if (isLoading && !restaurant) { // 修改加载条件，只有在 restaurant 为 null 时显示全屏加载
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" color={activeTintColor} />
                <ThemedText style={{ marginTop: Layout.spacing.md }}>正在加载餐厅...</ThemedText>
            </ThemedView>
        );
    }

    if (error || !restaurant) {
        return (
            <ThemedView style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={48} color={Colors.common.danger} />
                <ThemedText type="subtitle" style={{ marginTop: Layout.spacing.md, color: Colors.common.danger }}>
                    {error || "Restaurant not found."}
                </ThemedText>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText style={{ color: activeTintColor }}>Go Back</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        );
    }

    const ratingValue = parseFloat(String(restaurant['店铺总分'] || (typeof restaurant['店铺均分'] === 'object' && restaurant['店铺均分'] !== null ? restaurant['店铺均分']['口味'] : restaurant['店铺均分']) || 0));
    const avgPrice = restaurant['人均价格'] ? `¥${restaurant['人均价格']}` : '暂无';
    const distanceDisplay = restaurant.distance_km != null && restaurant.distance_km !== '?' ? `${restaurant.distance_km}km` : '';
    const recommendedDishesArray = restaurant['推荐菜'] && Array.isArray(restaurant['推荐菜']) && restaurant['推荐菜'][0] !== '-' ? restaurant['推荐菜'] : [];

    return (
        <>
            <ThemedView style={[styles.container, {backgroundColor: colors.background}]}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* ... (Banner Image, Restaurant Name, Address, Rating/Price/Distance, Visit Site Button - 保持不变) ... */}
                    <Image source={{ uri: restaurant['图片链接'] || 'https://via.placeholder.com/400x250/E5E7EB/B0B0B0?text=No+Image' }} style={styles.bannerImage} resizeMode="cover"/>
                    <View style={styles.contentPadding}>
                        <ThemedText type="titleL" style={[styles.restaurantName, {color: colors.text}]}>{restaurant['店铺名']}</ThemedText>
                        {restaurant['店铺地址'] && ( <View style={styles.infoRow}><Ionicons name="location-sharp" size={18} color={colors.textSubtle} style={styles.icon} /><ThemedText style={[styles.addressText, { color: colors.textSubtle }]}>{restaurant['店铺地址']}</ThemedText></View> )}
                        <View style={[styles.ratingPriceDistanceContainer, { borderColor: colors.borderColor }]}>
                            <View style={styles.infoItem}><StarRating rating={ratingValue} starSize={20} color={colors.starColor}/>{restaurant['评论总数'] && <ThemedText style={[styles.ratingCount, { color: colors.textSubtle }]}>({restaurant['评论总数']} 条评价)</ThemedText>}</View>
                            {restaurant['人均价格'] && ( <View style={styles.infoItem}><FontAwesome5 name="money-bill-wave" size={16} color={colors.textSubtle} style={styles.icon} /><ThemedText style={[styles.infoText, { color: colors.text }]}>人均 {avgPrice}</ThemedText></View> )}
                            {distanceDisplay && ( <View style={styles.infoItem}><MaterialCommunityIcons name="map-marker-distance" size={18} color={colors.textSubtle} style={styles.icon} /><ThemedText style={[styles.infoText, { color: colors.text }]}>{distanceDisplay}</ThemedText></View> )}
                        </View>
                        {restaurant['详情链接'] && ( <TouchableOpacity style={[styles.actionButton, { backgroundColor: activeTintColor }]} onPress={handleVisitRestaurantSite}><Ionicons name="globe-outline" size={20} color={Colors.common.white} style={{marginRight: Layout.spacing.sm}} /><RNText style={[styles.actionButtonText, {color: Colors.common.white}]}>访问餐厅网站</RNText></TouchableOpacity> )}

                        {/* --- Details Section (Tags, Phone, etc. - 保持不变) --- */}
                        <View style={styles.detailsSection}>
                            {(restaurant['标签1'] || restaurant['标签2']) && ( <View style={styles.detailRow}><Ionicons name="pricetags-outline" size={20} color={colors.textSubtle} style={styles.detailIcon} /><View style={styles.tagContainer}>{restaurant['标签1'] && ( <View style={[styles.tag, { backgroundColor: lightPurpleBackground, borderColor: tagBorderColor }]}><ThemedText style={[styles.tagText, { color: purpleTagText }]}>{restaurant['标签1']}</ThemedText></View> )}{restaurant['标签2'] && ( <View style={[styles.tag, { backgroundColor: lightPurpleBackground, borderColor: tagBorderColor }]}><ThemedText style={[styles.tagText, { color: purpleTagText }]}>{restaurant['标签2']}</ThemedText></View> )}</View></View> )}
                            {restaurant['店铺电话'] && ( <TouchableOpacity onPress={() => Linking.openURL(`tel:${restaurant['店铺电话']}`)} style={styles.detailRowTouchable}><View style={styles.detailRowContent}><Ionicons name="call-outline" size={20} color={colors.textSubtle} style={styles.detailIcon} /><ThemedText style={styles.detailItemText}><ThemedText type="defaultSemiBold">电话: </ThemedText><RNText style={{ color: activeTintColor, fontSize: Layout.fontSize.md }}>{restaurant['店铺电话']}</RNText></ThemedText></View></TouchableOpacity> )}
                            {recommendedDishesArray.length > 0 && ( <View style={styles.detailRow}><Ionicons name="star-outline" size={20} color={colors.textSubtle} style={styles.detailIcon} /><View style={styles.tagContainer}>{recommendedDishesArray.slice(0, 5).map((dish, index) => ( <View key={index} style={[styles.tag, { backgroundColor: lightPurpleBackground, borderColor: tagBorderColor }]}><ThemedText style={[styles.tagText, { color: purpleTagText }]}>{dish}</ThemedText></View> ))}</View></View> )}
                            {restaurant['优惠券信息'] && restaurant['优惠券信息'] !== '-' && ( <View style={styles.detailRow}><Ionicons name="gift-outline" size={20} color={colors.textSubtle} style={styles.detailIcon} /><ThemedText style={styles.detailItemText}><ThemedText type="defaultSemiBold">优惠: </ThemedText>{restaurant['优惠券信息']}</ThemedText></View> )}
                            {restaurant['其他信息'] && restaurant['其他信息'] !== '-' && ( <View style={styles.detailRow}><Ionicons name="information-circle-outline" size={20} color={colors.textSubtle} style={styles.detailIcon} /><ThemedText style={styles.detailItemText}><ThemedText type="defaultSemiBold">其他信息: </ThemedText>{restaurant['其他信息']}</ThemedText></View> )}
                        </View>
                    </View>

                    {/* 更多餐厅 */}
                    {otherRestaurants.length > 0 && (
                        <View style={styles.otherRestaurantsSection}>
                            <SectionHeader title="更多热门餐厅" />
                            {isLoadingOther ? (
                                <ActivityIndicator style={{marginTop: Layout.spacing.md}} color={activeTintColor} />
                            ) : (
                                <FlatList
                                    data={otherRestaurants}
                                    renderItem={({ item }) => (
                                        <RestaurantListItem
                                            restaurant={{...item, is_favorites: item.is_favorites }} // 确保传递is_favorites
                                            onPress={() => handleRestaurantPressOther(item._id)}
                                            // 使用新的 handler 处理 "更多餐厅" 列表项的收藏切换
                                            onToggleFavorite={() => handleToggleFavoriteForOtherRestaurant(item._id, !!item.is_favorites)}
                                        />
                                    )}
                                    keyExtractor={(item) => `other-${item._id}`}
                                    contentContainerStyle={styles.otherListContent}
                                    scrollEnabled={false}
                                />
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* 修改底部按钮 */}
                <View style={[styles.bookingButtonContainer, { backgroundColor: colors.cardBg, borderTopColor: colors.borderColor }]}>
                    <TouchableOpacity
                        style={[
                            styles.bookingButton,
                            { backgroundColor: isFavorite ? colors.textSubtle : activeTintColor } // 根据收藏状态改变背景色
                        ]}
                        onPress={handleToggleFavoriteBottomButton} // 绑定新的 handler
                        disabled={isTogglingBottomFavorite || isTogglingFavorite} // 任意一个在加载中都禁用
                    >
                        {isTogglingBottomFavorite ? (
                            <ActivityIndicator color={Colors.common.white} />
                        ) : (
                            <RNText style={[styles.bookingButtonText, {color: Colors.common.white}]}>
                                {isFavorite ? '已在购物车 / 移除' : '加入购物车'}
                            </RNText>
                        )}
                    </TouchableOpacity>
                </View>
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: Layout.spacing.xxl + 80, // Ensure Layout.spacing.xxl is defined
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Layout.spacing.lg,
    },
    backButton: {
        marginTop: Layout.spacing.lg,
        paddingVertical: Layout.spacing.sm,
        paddingHorizontal: Layout.spacing.lg,
        borderRadius: Layout.borderRadius.md,
    },
    bannerImage: {
        width: '100%',
        height: 250,
        backgroundColor: Colors.common.placeholderBg,
    },
    contentPadding: {
        paddingHorizontal: Layout.spacing.page,
        paddingTop: Layout.spacing.md,
    },
    restaurantName: {
        marginBottom: Layout.spacing.sm,
        // Removed type: 'title' from here, apply it on ThemedText directly if needed
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
    },
    addressText: { // color will be applied dynamically
        flex: 1,
        fontSize: Layout.fontSize.md,
    },
    icon: {
        marginRight: Layout.spacing.sm,
    },
    ratingPriceDistanceContainer: { // borderColor will be applied dynamically
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: Layout.spacing.lg,
        borderBottomWidth: 1,
        borderTopWidth: 1,
        paddingVertical: Layout.spacing.md,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: Layout.spacing.md, // For spacing between items in a row
        marginBottom: Layout.spacing.xs, // For spacing if items wrap
    },
    infoText: { // color will be applied dynamically
        fontSize: Layout.fontSize.md,
    },
    ratingCount: { // color will be applied dynamically
        fontSize: Layout.fontSize.sm,
        marginLeft: Layout.spacing.xs,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        marginBottom: Layout.spacing.lg,
    },
    actionButtonText: {
        color: Colors.dark.text, // Assuming buttons with activeTintColor background need light text
        fontSize: Layout.fontSize.md,
        fontWeight: 'bold',
    },
    otherRestaurantsSection: {
        marginTop: Layout.spacing.md,
        paddingHorizontal: Layout.spacing.page,
    },
    otherListContent: {
        // Add padding if needed, e.g., paddingBottom: Layout.spacing.md
    },
    bookingButtonContainer: { // backgroundColor and borderColor applied dynamically
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Layout.spacing.md,
        // Adjust paddingBottom to accommodate for any system navigation bars or custom bottom tabs
        paddingBottom: Layout.spacing.md + (Layout.bottomNavHeight ? Layout.bottomNavHeight / 3 : 10),
        borderTopWidth: 1,
    },
    bookingButton: {
        paddingVertical: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookingButtonText: {
        color: Colors.dark.text, // Assuming buttons with activeTintColor background need light text
        fontSize: Layout.fontSize.lg,
        fontWeight: 'bold',
    },
    detailsSection: {
        marginTop: Layout.spacing.lg, // 增加与上方元素的间距
        marginBottom: Layout.spacing.lg,
        // 移除旧的 detailItem 的直接子元素样式，现在由 detailRow 控制
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // 如果文本可能多行，图标与第一行对齐
        marginBottom: Layout.spacing.md, // 每个详情项之间的间距
    },
    detailRowTouchable: { // 用于可点击的行，如电话
        // 本身不需要很多样式，交给内部的 detailRowContent
    },
    detailRowContent: { // 用于 TouchableOpacity 内部的布局，与 detailRow 类似
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    detailIcon: {
        marginRight: Layout.spacing.md, // 图标与文本之间的间距
        marginTop: 2, // 微调图标垂直对齐 (根据字体和行高可能需要)
    },
    detailItemText: {
        flex: 1, // 允许文本占用剩余空间并换行
        fontSize: Layout.fontSize.md,
        lineHeight: Layout.fontSize.md * 1.5, // 保持原有行高
        // color: colors.text, // ThemedText 默认会处理
    },
    tagContainer: {
        flex: 1, // Allows tags to take available width next to icon
        flexDirection: 'row',
        flexWrap: 'wrap', // Tags will wrap to the next line if they don't fit
        alignItems: 'center', // Vertically align tags if they wrap to new lines
    },
    tag: {
        paddingHorizontal: Layout.spacing.sm, // e.g., 12px
        paddingVertical: 4, // e.g., 4px + 2px = 6px
        borderRadius: Layout.borderRadius.md, // e.g., 8px for rounded corners
        marginRight: Layout.spacing.xs,   // e.g., 8px space to the right of each tag
        marginBottom: Layout.spacing.xs,  // e.g., 8px space below each tag (for wrapping)
        borderWidth: 1,
        // backgroundColor and borderColor are set dynamically in the JSX
    },
    tagText: {
        fontSize: Layout.fontSize.sm, // e.g., 12px, slightly smaller than detailItemText
        fontWeight: '500',
        // color is set dynamically in the JSX
    },
});
