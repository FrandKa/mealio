// services/apiService.ts
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/Api';
import { Restaurant, RestaurantApiParams, Cuisine } from '@/types';

// 定义 API 返回的餐厅列表结构
type RestaurantsApiResponse = {
    restaurants: Restaurant[];
    total: number;
    page: number;
    per_page: number;
    // ... 其他可能的元数据
};

// 定义 API 返回的菜系列表结构
type CuisinesApiResponse = {
    subtitle: string[]; // API 返回的是字符串数组
    total: number;
    page: number;
    per_page: number;
};

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            // 如果响应体不是 JSON 或为空
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData?.error || `API error: ${response.status}`);
    }
    return response.json();
};

export const fetchRestaurantsAPI = async (
    params: RestaurantApiParams
): Promise<RestaurantsApiResponse> => {
    const queryParams = new URLSearchParams();

    // 将 params 对象中的有效值添加到 URLSearchParams
    (Object.keys(params) as Array<keyof RestaurantApiParams>).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            queryParams.append(key, String(value));
        }
    });

    const url = `${API_BASE_URL}${API_ENDPOINTS.RESTAURANTS}?${queryParams.toString()}`;
    console.log('Requesting Restaurants:', url);

    const response = await fetch(url);
    return handleApiResponse(response);
};

export const fetchCuisinesAPI = async (
    page: number = 1,
    perPage: number = 10, // 保持与 MoreCuisinesModal 中的 ITEMS_PER_PAGE 一致或可配置
    keyword?: string
): Promise<CuisinesApiResponse> => {
    const queryParams = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
    });
    if (keyword) {
        queryParams.append('keyword', keyword);
    }

    const url = `${API_BASE_URL}${API_ENDPOINTS.RESTAURANT_SUBTITLES}?${queryParams.toString()}`;
    console.log('Requesting Cuisines:', url);

    const response = await fetch(url);
    return handleApiResponse(response);
};
