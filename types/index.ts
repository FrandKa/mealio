// types/index.ts

// 这是 LocationCoords 的定义
export interface LocationCoords {
    latitude: number;
    longitude: number;
    accuracy?: number | null; // 定位精度(米)
    altitude?: number | null; // 海拔高度(米)
    altitudeAccuracy?: number | null; // 海拔精度(米)
    heading?: number | null;    // 设备方向 (0-360度, 0为正北)
    speed?: number | null;      // 设备速度 (米/秒)
}

// From RestaurantListItem.tsx 移动过来的 Restaurant 类型
export type Restaurant = {
    _id: string;
    '店铺名': string;
    '图片链接'?: string;
    '店铺总分'?: number | string; // Can be "3.5" or 3.5
    '店铺均分'?: { // This can be an object
        "口味": string;
        "服务": string;
        "环境": string;
    } | number | string; // Or just a number/string if the API is inconsistent
    '标签1'?: string;
    '标签2'?: string;
    '人均价格'?: number | string;
    distance_km?: number | string;
    '推荐菜'?: string[];
    '详情链接'?: string;
    is_favorites?: boolean; // 可以添加收藏状态

    // Fields often present in detail view
    '店铺地址'?: string;
    '店铺电话'?: string;
    '优惠券信息'?: string;
    '其他信息'?: string;
    '评论总数'?: string | number;
    '店铺纬度'?: number;
    '店铺经度'?: number;
    // location_geo is explicitly excluded from display
};

// ... rest of your types (AppliedFilters, RestaurantApiParams, Cuisine)
export type AppliedFilters = {
    priceValue: string;
    customMinPrice: string;
    customMaxPrice: string;
    distance: string | null;
    cuisine: string;
    searchTerm?: string;
};

export type RestaurantApiParams = {
    name?: string;
    keyword?: string;
    min_price?: number;
    max_price?: number;
    location?: string;
    distance?: number;
    page?: number;
    per_page?: number;
};

export type Cuisine = {
    name: string;
};
