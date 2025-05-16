// constants/Api.ts
export const API_BASE_URL = 'http://1.94.123.228:5000/api/v1'; // 从您的 JS 文件中获取

export const API_ENDPOINTS = {
    RESTAURANTS: '/restaurants',
    RESTAURANT_SUBTITLES: '/restaurants/subtitles', // (菜系),
    USER: '/user',
    USER_PROFILE: '/user/profile', // <--- 新增
    USER_AVATAR_UPLOAD: '/user/avatar/upload',
    // 其他端点...
    // Cart Endpoints
    CART_ADD: '/cart/add',
    CART_REMOVE: '/cart/remove',
    CART_GET: '/cart', // 通常 GET /cart 用于获取列表
    CART_COUNT: '/cart/count',
    CART_CONTAINS: '/cart/contains', // 例如 /cart/contains?restaurant_id=xxx
    CART_CLEAR: '/cart/clear',
};
