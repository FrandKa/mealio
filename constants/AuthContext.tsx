// constants/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {getItemAsync, deleteItemAsync, setItemAsync} from  '@/constants/storage'
import { API_BASE_URL } from '@/constants/Api';

const TOKEN_KEY = 'my-app-auth-token';
const USER_KEY = 'my-app-user-info';

// 扩展 UserProfile 接口以包含后端返回的字段
export interface UserProfile {
    userId: string; // 来自登录/注册或 profile 接口的 user_id
    username: string; // 来自登录/注册，profile 接口可能不直接返回或不优先使用
    phone?: string;
    nickname?: string; // 来自 profile 接口
    avatar?: string;   // 来自 profile 接口
    gender?: string;   // 来自 profile 接口
    preferences?: { [key: string]: any }; // 来自 profile 接口
    // 你可以根据 /user/profile 返回的实际数据添加更多字段
}

// LoginResponseData 中的 user 类型是登录/注册时直接返回的，可能不包含所有 profile 细节
interface LoginResponseData {
    accessToken: string;
    user: {
        userId: string;
        username: string;
        phone?: string;
    };
    // other fields like expiresIn, tokenType
}

// AuthData 接口现在包含 fetchUserProfile 和购物车相关
interface AuthData {
    session?: string | null;
    user?: UserProfile | null;
    isLoading: boolean;
    signIn: (data: LoginResponseData) => Promise<void>;
    signOut: () => void;
    updateUser: (newUserData: Partial<UserProfile>) => Promise<void>;
    fetchUserProfile: (currentToken?: string | null) => Promise<UserProfile | null>;
    cartItemCount: number; // 新增购物车数量
    fetchCartCount: (tokenOverride?: string | null) => Promise<void>; // 新增获取购物车数量的方法
}

// createContext 的默认值也需要包含
export const AuthContext = createContext<AuthData>({
    session: undefined,
    user: undefined,
    isLoading: true,
    signIn: async () => { console.warn('signIn called on default AuthContext'); },
    signOut: () => { console.warn('signOut called on default AuthContext'); },
    updateUser: async () => { console.warn('updateUser called on default AuthContext'); },
    fetchUserProfile: async () => {
        console.warn('fetchUserProfile called on default AuthContext');
        return null;
    },
    cartItemCount: 0,
    fetchCartCount: async () => { console.warn('fetchCartCount called on default AuthContext'); },
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<string | null | undefined>(undefined);
    const [user, setUser] = useState<UserProfile | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [cartItemCount, setCartItemCount] = useState(0); // 新增 state

    // 内部使用的 fetchWithAuth，避免循环依赖，因为它在 AuthProvider 内部被调用
    const fetchWithAuthInternal = async (endpoint: string, options: RequestInit = {}, tokenOverride?: string | null) => {
        const tokenToUse = tokenOverride !== undefined ? tokenOverride : session;
        if (!tokenToUse) {
            throw { status: 401, message: 'No token available for authenticated request.' };
        }

        const headers = new Headers(options.headers || {});
        headers.append('Authorization', `Bearer ${tokenToUse}`);
        headers.append('Content-Type', 'application/json');

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); }
            catch (e) { throw new Error(`API error: ${response.status} ${response.statusText}`); }
            throw { status: response.status, message: errorData?.error || `API error: ${response.status}` };
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return response.json();
        }
        if (response.status === 204) return null;
        return response.text().then(text => text ? JSON.parse(text) : {});
    };

    const updateUser = async (newUserData: Partial<UserProfile>) => {
        const baseUserId = newUserData.userId || user?.userId;
        if (!baseUserId) {
            console.warn("updateUser: Cannot update user without a userId.");
            return;
        }
        const updatedUser = {
            ...(user || { userId: baseUserId, username: '' }),
            ...newUserData,
            userId: baseUserId,
        };
        setUser(updatedUser);
        await setItemAsync(USER_KEY, JSON.stringify(updatedUser));
        console.log("User profile updated in context and SecureStore:", updatedUser);
    };

    const fetchCartCount = async (tokenOverride?: string | null) => {
        const tokenToUse = tokenOverride !== undefined ? tokenOverride : session;
        if (!tokenToUse) {
            setCartItemCount(0);
            return;
        }
        try {
            const data = await fetchWithAuthInternal('/cart/count', {}, tokenToUse);
            if (typeof data.count === 'number') {
                setCartItemCount(data.count);
                console.log("Cart count updated:", data.count);
            } else {
                console.warn("fetchCartCount: API response did not contain a valid count.", data);
                setCartItemCount(0);
            }
        } catch (error) {
            console.error("Failed to fetch cart count:", error);
            setCartItemCount(0);
        }
    };

    const fetchUserProfile = async (currentToken?: string | null) => {
        const tokenToUse = currentToken !== undefined ? currentToken : session;
        if (!tokenToUse) {
            console.log("fetchUserProfile: No session token, cannot fetch profile.");
            return null;
        }
        try {
            console.log("fetchUserProfile: Fetching user profile with token...");
            const profileDataFromApi = await fetchWithAuthInternal('/user/profile', {}, tokenToUse);

            if (!profileDataFromApi || !profileDataFromApi.user_id) {
                console.warn("fetchUserProfile: Fetched profile data is invalid or missing user_id.");
                return null;
            }
            const fetchedUserProfile: UserProfile = {
                userId: profileDataFromApi.user_id,
                username: profileDataFromApi.username || user?.username || profileDataFromApi.nickname || '',
                phone: profileDataFromApi.phone,
                nickname: profileDataFromApi.nickname,
                avatar: profileDataFromApi.avatar,
                gender: profileDataFromApi.gender,
                preferences: profileDataFromApi.preferences,
            };
            await updateUser(fetchedUserProfile);
            return fetchedUserProfile;
        } catch (error: any) {
            console.error("fetchUserProfile: Failed to fetch user profile:", error);
            if (error.status === 401) {
                await signOut();
            }
            return null;
        }
    };


    useEffect(() => {
        const loadAuthData = async () => {
            setIsLoading(true);
            try {
                const storedToken = await getItemAsync(TOKEN_KEY);
                console.log('Loaded from SecureStore - Token:', storedToken ? 'Exists' : 'None');

                if (storedToken) {
                    setSession(storedToken);
                    // Fetch cart count using the stored token
                    await fetchCartCount(storedToken); // Fetch cart count right after setting session

                    const storedUserString = await getItemAsync(USER_KEY);
                    console.log('Loaded from SecureStore - User String:', storedUserString ? 'Exists' : 'None');
                    if (storedUserString) {
                        try {
                            const storedUser = JSON.parse(storedUserString);
                            if (storedUser && storedUser.userId && typeof storedUser.username !== 'undefined') {
                                setUser(storedUser);
                            } else {
                                console.warn("Stored user data is malformed, fetching profile anew.");
                                await fetchUserProfile(storedToken);
                            }
                        } catch (parseError) {
                            console.error("Failed to parse stored user data, fetching profile anew.", parseError);
                            await deleteItemAsync(USER_KEY);
                            await fetchUserProfile(storedToken);
                        }
                    } else {
                        console.log("No stored user, fetching profile with stored token.");
                        await fetchUserProfile(storedToken);
                    }
                } else {
                    setUser(null);
                    setSession(null);
                    setCartItemCount(0); // No token, so cart count is 0
                }
            } catch (e) {
                console.error('Failed to load auth data from storage', e);
                setUser(null);
                setSession(null);
                setCartItemCount(0); // Error, so cart count is 0
            } finally {
                setIsLoading(false);
            }
        };
        loadAuthData();
    }, []); // This effect runs once on mount


    const signIn = async (data: LoginResponseData) => {
        setIsLoading(true);
        setSession(data.accessToken);
        const initialUser: UserProfile = {
            userId: data.user.userId,
            username: data.user.username,
            phone: data.user.phone,
        };
        setUser(initialUser);
        await setItemAsync(TOKEN_KEY, data.accessToken);
        await setItemAsync(USER_KEY, JSON.stringify(initialUser));

        // Fetch full profile and cart count after successful sign-in
        await fetchUserProfile(data.accessToken); // fetchUserProfile will call updateUser
        await fetchCartCount(data.accessToken);   // Fetch cart count with new token

        setIsLoading(false);
    };

    const signOut = async () => {
        setIsLoading(true);
        setSession(null);
        setUser(null);
        setCartItemCount(0); // Reset cart count on sign out
        await deleteItemAsync(TOKEN_KEY);
        await deleteItemAsync(USER_KEY);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{
            session,
            user,
            isLoading,
            signIn,
            signOut,
            updateUser,
            fetchUserProfile,
            cartItemCount,
            fetchCartCount
        }}>
            {children}
        </AuthContext.Provider>
    );
};

console.log('AuthContext module loaded and parsed.');
