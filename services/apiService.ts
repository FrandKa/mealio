// services/apiService.ts
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/Api';
import { Restaurant, RestaurantApiParams, Cuisine } from '@/types';
import {getItemAsync} from  '@/constants/storage'

const TOKEN_KEY = 'my-app-auth-token'; // 与 AuthContext 中使用的键一致

// --- API Response Structures ---
type RestaurantsApiResponse = {
    restaurants: Restaurant[];
    total: number;
    page: number;
    per_page: number;
    totalPages?: number; // 后端获取购物车列表时有这个字段
};

type CuisinesApiResponse = {
    subtitle: string[];
    total: number;
    page: number;
    per_page: number;
};

type CartCountResponse = {
    count: number;
    message: string;
    user_id: string;
};

type InCartResponse = {
    in_cart: boolean;
};

type CartActionResponse = {
    message: string;
    // 根据后端实际返回情况，可能还有其他字段
    cart_item?: any; // 例如，添加成功后返回的购物车项
    user_id?: string;
};


// --- Helper: 获取认证 Token ---
const getAuthToken = async (): Promise<string | null> => {
    return await getItemAsync(TOKEN_KEY);
};

// --- Helper: 处理 API 响应 ---
const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            const errorText = await response.text().catch(() => `API error: ${response.status} ${response.statusText}`);
            throw new Error(errorData?.message || errorData?.error || errorText || `API error: ${response.status} ${response.statusText}`);
        }
        const errorMessage = errorData?.message || errorData?.error || `API error: ${response.status}`;
        if (errorMessage === '未提供Token' || response.status === 401 || (errorData?.error && String(errorData.error).toLowerCase().includes('token'))) {
            throw { status: response.status, message: '未提供Token或Token无效', isAuthError: true };
        }
        throw new Error(errorMessage);
    }
    if (response.status === 204) { // No Content
        return null;
    }
    // Try to parse JSON, but if content-type is not JSON or body is empty, handle gracefully
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const text = await response.text(); // Get text first to check if empty
        return text ? JSON.parse(text) : null; // If text is empty, return null instead of parsing error
    }
    return response.text(); // For non-JSON responses, return text or handle as needed
};

// --- Helper: 创建带认证的请求 Headers ---
const createAuthHeaders = async (existingHeaders?: HeadersInit): Promise<Headers> => {
    const headers = new Headers(existingHeaders || {});
    const token = await getAuthToken();
    if (token) {
        console.log("token", token)
        headers.append('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(existingHeaders && (existingHeaders instanceof FormData))) { // FormData 会自动设置 Content-Type
        headers.append('Content-Type', 'application/json');
    }
    return headers;
};


// --- Restaurant APIs (需要认证) ---
export const fetchRestaurantsAPI = async (
    params: RestaurantApiParams
): Promise<RestaurantsApiResponse> => {
    const queryParams = new URLSearchParams();
    (Object.keys(params) as Array<keyof RestaurantApiParams>).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            queryParams.append(key, String(value));
        }
    });
    const url = `${API_BASE_URL}${API_ENDPOINTS.RESTAURANTS}?${queryParams.toString()}`;
    console.log('Requesting Restaurants:', url);
    const headers = await createAuthHeaders();
    const response = await fetch(url, { headers });
    return handleApiResponse(response);
};

export const fetchRestaurantDetailAPI = async (
    id: string,
    userLocation?: string
): Promise<Restaurant> => {
    let url = `${API_BASE_URL}${API_ENDPOINTS.RESTAURANTS}/${id}`;
    if (userLocation) {
        url += `?location=${userLocation}`;
    }
    console.log('Requesting Restaurant Detail:', url);
    const headers = await createAuthHeaders();
    const response = await fetch(url, { headers });
    return handleApiResponse(response);
};

// --- Cuisine API (通常不需要认证，但如果需要，可以修改) ---
export const fetchCuisinesAPI = async (
    page: number = 1,
    perPage: number = 10,
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
    // const headers = await createAuthHeaders(); // 如果需要认证
    const response = await fetch(url); // 如果不需要认证
    return handleApiResponse(response);
};


// --- Cart APIs (都需要认证) ---

/**
 * 添加餐厅到购物车
 */
export const addToCartAPI = async (restaurantId: string): Promise<CartActionResponse> => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.CART_ADD}`;
    console.log('Adding to cart:', url, 'Restaurant ID:', restaurantId);
    const headers = await createAuthHeaders();
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ restaurant_id: restaurantId }),
    });
    return handleApiResponse(response);
};

/**
 * 从购物车移除餐厅
 */
export const removeFromCartAPI = async (restaurantId: string): Promise<CartActionResponse | null> => { // DELETE 可能返回 204
    const url = `${API_BASE_URL}${API_ENDPOINTS.CART_REMOVE}`;
    console.log('Removing from cart:', url, 'Restaurant ID:', restaurantId);
    const headers = await createAuthHeaders();
    const response = await fetch(url, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ restaurant_id: restaurantId }),
    });
    return handleApiResponse(response); // handleApiResponse 会处理 204
};

/**
 * 分页获取购物车信息
 */
export const fetchCartAPI = async (page: number = 1, per_page: number = 10): Promise<RestaurantsApiResponse> => {
    const queryParams = new URLSearchParams({
        page: String(page),
        per_page: String(per_page),
    });
    const url = `${API_BASE_URL}${API_ENDPOINTS.CART_GET}?${queryParams.toString()}`;
    console.log('Fetching cart:', url);
    const headers = await createAuthHeaders();
    const response = await fetch(url, { headers });
    return handleApiResponse(response);
};

/**
 * 获取购物车中物品数量
 */
export const fetchCartCountAPI = async (): Promise<CartCountResponse> => {
    const url = `${API_BASE_URL}${API_ENDPOINTS.CART_COUNT}`;
    console.log('Fetching cart count:', url);
    const headers = await createAuthHeaders();
    const response = await fetch(url, { headers });
    return handleApiResponse(response);
};

/**
 * 检查某个餐厅是否存在于购物车中
 */
export const checkInCartAPI = async (restaurantId: string): Promise<InCartResponse> => {
    const queryParams = new URLSearchParams({ restaurant_id: restaurantId });
    const url = `${API_BASE_URL}${API_ENDPOINTS.CART_CONTAINS}?${queryParams.toString()}`;
    console.log('Checking if in cart:', url);
    const headers = await createAuthHeaders();
    const response = await fetch(url, { headers });
    return handleApiResponse(response);
};

/**
 * 清空购物车
 */
export const clearCartAPI = async (): Promise<CartActionResponse | null> => { // DELETE 可能返回 204
    const url = `${API_BASE_URL}${API_ENDPOINTS.CART_CLEAR}`;
    console.log('Clearing cart:', url);
    const headers = await createAuthHeaders();
    const response = await fetch(url, {
        method: 'DELETE',
        headers,
        // DELETE 请求通常不带 body，如果后端需要，则添加
    });
    return handleApiResponse(response); // handleApiResponse 会处理 204
};
