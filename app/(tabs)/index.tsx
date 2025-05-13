// app/(tabs)/index.tsx
import React, { useState } from 'react';
import { StyleSheet, ScrollView, FlatList, View } from 'react-native'; // 使用 FlatList
import AppHeader from '@/components/common/AppHeader';
import BannerSlider from '@/components/common/BannerSlider';
import SectionHeader from '@/components/common/SectionHeader'; // <--- 引入
import RestaurantListItem, { Restaurant } from '@/components/common/RestaurantListItem'; // <--- 引入
import { ThemedView } from '@/components/ThemedView';
import Layout from '@/constants/Layout';

// 模拟餐厅数据 (应该从 hook/API 获取)
const mockRestaurants: Restaurant[] = [
    {
        _id: '1',
        '店铺名': '三余书社·探微咖啡 (A very long name to test truncation indeed)',
        '图片链接': 'http://p0.meituan.net/biztone/112986625_1633743318758.jpeg%40340w_255h_1e_1c_1l%7Cwatermark%3D0', // 替换为真实或占位图
        '店铺总分': 4.5,
        '标签1': '咖啡厅',
        '人均价格': 42,
        distance_km: 1,
        '推荐菜': ['手冲耶加雪菲', '芝士蛋糕'],
    },
    {
        _id: '2',
        '店铺名': '宾来乐川味自助小火锅',
        '图片链接': 'https://img.meituan.net/content/3c8fb181d9028d604e9b984b17359081144136.jpg%40340w_255h_1e_1c_1l%7Cwatermark%3D0',
        '店铺均分': "4.7", // API 可能返回字符串
        '标签1': '自助小火锅',
        '人均价格': "47",
        distance_km: "2.7",
        '推荐菜': ['肥牛', '麻辣锅底'],
    },
    {
        _id: '3',
        '店铺名': '科巷以北·南京家常菜',
        '图片链接': 'http://p0.meituan.net/biztone/b6d4a6744c387172d0b91f54a5535814394205.jpg%40340w_255h_1e_1c_1l%7Cwatermark%3D0',
        '店铺总分': 4.2,
        '标签1': '南京菜',
        '人均价格': 48,
        distance_km: 2.5,
        '推荐菜': ['盐水鸭', '美龄粥'],
    },
];


export default function HomeScreen() {
    const [searchTerm, setSearchTerm] = useState('');
    const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants); // 初始餐厅数据

    const handleMenuPress = () => {
        console.log('Menu button pressed');
    };

    const handleSearchPress = () => {
        console.log('Search pressed with term:', searchTerm);
        // TODO: 实现基于 searchTerm 的筛选逻辑
    };

    const handleFilterPress = () => {
        console.log('Filter button pressed');
        // TODO: 打开筛选模态框
    };

    const handleRestaurantPress = (id: string) => {
        console.log('Restaurant pressed:', id);
        // TODO: 导航到餐厅详情页
    };

    const handleToggleFavorite = (id: string, isFavorite: boolean) => {
        console.log('Restaurant favorite toggled:', id, isFavorite);
        // TODO: 更新餐厅的收藏状态
    };


    // renderItem for FlatList
    const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
        <RestaurantListItem
            restaurant={item}
            onPress={handleRestaurantPress}
            onToggleFavorite={handleToggleFavorite}
            // isFavoriteInitial={...} // TODO: 从全局状态获取初始收藏状态
        />
    );

    return (
        <ThemedView style={styles.container}>
            <AppHeader
                onMenuPress={handleMenuPress}
                onSearchPress={handleSearchPress}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
            />
            <FlatList
                data={restaurants}
                renderItem={renderRestaurantItem}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={( // FlatList 的头部，包含 Banner 和 SectionHeader
                    <>
                        <BannerSlider />
                        <SectionHeader
                            title="附近的餐厅"
                            onFilterPress={handleFilterPress}
                            // filterText="所有价格" // TODO: 动态更新筛选文本
                        />
                    </>
                )}
                contentContainerStyle={styles.listContentContainer}
                showsVerticalScrollIndicator={false}
                // TODO: 实现上拉加载更多 (onEndReached, onEndReachedThreshold, ListFooterComponent for loading indicator)
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContentContainer: {
        paddingHorizontal: Layout.spacing.page, // 给列表项左右边距
        paddingBottom: Layout.spacing.xl + Layout.bottomNavHeight,
    },
    // pageTitle (现在由 SectionHeader 处理)
});
