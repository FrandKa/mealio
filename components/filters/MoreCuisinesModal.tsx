// components/filters/MoreCuisinesModal.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useColorScheme as useRColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import FilterChip from '@/components/common/FilterChip';
import { Cuisine } from '@/types';
import { fetchCuisinesAPI } from '@/services/apiService';

const ITEMS_PER_PAGE = 12; // 与 CSS 中的 #more-cuisines-list .modal-chip 大致匹配，或API的per_page

type MoreCuisinesModalProps = {
    isVisible: boolean;
    onClose: () => void;
    onCuisineSelect: (cuisine: Cuisine) => void;
};

const MoreCuisinesModal: React.FC<MoreCuisinesModalProps> = ({
                                                                 isVisible,
                                                                 onClose,
                                                                 onCuisineSelect,
                                                             }) => {
    const rnColorScheme = useRColorScheme();
    const currentColorScheme = rnColorScheme ?? 'light';
    const colors = Colors[currentColorScheme];
    const commonColors = Colors.common;
    const insets = useSafeAreaInsets();

    const [searchTerm, setSearchTerm] = useState('');
    const [displayedCuisines, setDisplayedCuisines] = useState<Cuisine[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [totalCuisinesCount, setTotalCuisinesCount] = useState(0);
    // isLoadingMore 不再需要，因为我们通过按钮分页

    const isInitializingSearchTerm = useRef(false);


    const loadCuisines = useCallback(async (
        page: number,
        term: string,
        actionType: 'initial' | 'search' | 'paginate' = 'initial' // 新增 'paginate'
    ) => {
        // 如果是分页操作，但正在加载中，则不执行
        if (actionType === 'paginate' && isLoading) { console.log("Cuisines: Skipping paginate - already loading."); return; }
        // 对于 initial 或 search，如果 isLoading 为 true，也可能需要跳过
        if ((actionType === 'initial' || actionType === 'search') && isLoading) { console.log(`Cuisines: Skipping ${actionType} - main load in progress.`); return; }

        console.log(`Cuisines: Executing load. Page: ${page}, Term: "${term}", Action: ${actionType}`);

        setIsLoading(true); // 统一使用 isLoading

        try {
            const data = await fetchCuisinesAPI(page, ITEMS_PER_PAGE, term);
            console.log("Cuisines API Response:", data);
            const newCuisines = data.subtitle.map(name => ({ name }));

            // 分页或搜索时，总是替换当前页数据
            setDisplayedCuisines(newCuisines);
            setTotalCuisinesCount(data.total);
            setCurrentPage(data.page); // 使用 API 返回的页码
        } catch (error: any) {
            console.error("获取菜系失败:", error);
            Alert.alert("错误", `加载菜系列表失败: ${error.message}`);
        } finally {
            setIsLoading(false);
            console.log("Cuisines: Finished load. isLoading:", isLoading);
        }
    }, []); // 依赖项为空

    // Effect for when the modal becomes visible
    useEffect(() => {
        if (isVisible) {
            console.log("Cuisines Modal became visible. Resetting and loading initial.");
            isInitializingSearchTerm.current = true;
            setSearchTerm('');
            setCurrentPage(1); // 确保页码重置
            // displayedCuisines 和 totalCuisinesCount 会在 loadCuisines 中被设置
            loadCuisines(1, '', 'initial').finally(() => {
                isInitializingSearchTerm.current = false;
            });
        }
    }, [isVisible, loadCuisines]);

    // Effect for when searchTerm changes (with debounce)
    useEffect(() => {
        if (!isVisible || isInitializingSearchTerm.current) {
            if(isInitializingSearchTerm.current && searchTerm === ''){
                // console.log("Cuisines: Search term reset by init, skipping search effect until user input.");
            }
            return;
        }

        const handler = setTimeout(() => {
            console.log("Cuisines: Search term effect. Current term:", `"${searchTerm}"`);
            // 搜索时总是加载第一页
            loadCuisines(1, searchTerm, 'search');
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm, isVisible, loadCuisines]);

    const handleSelectCuisine = (cuisine: Cuisine) => {
        onCuisineSelect(cuisine);
    };

    const handlePrevPage = () => {
        if (currentPage > 1 && !isLoading) {
            console.log("Cuisines: Loading previous page.");
            loadCuisines(currentPage - 1, searchTerm, 'paginate');
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages && !isLoading) {
            console.log("Cuisines: Loading next page.");
            loadCuisines(currentPage + 1, searchTerm, 'paginate');
        }
    };

    const renderCuisineItem = ({ item }: { item: Cuisine }) => (
        <FilterChip
            label={item.name}
            onPress={() => handleSelectCuisine(item)}
            style={styles.cuisineChip}
            textStyle={{ fontWeight: Layout.fontWeight.normal }}
            isActive={false} // 点击即选择，不需要 active 状态
        />
    );

    const totalPages = Math.ceil(totalCuisinesCount / ITEMS_PER_PAGE);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}/>
                <View style={[
                    styles.modalContainer,
                    { backgroundColor: colors.cardBg, paddingBottom: insets.bottom }
                ]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
                        <ThemedText style={styles.headerTitle}>选择菜系</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
                        <TextInput
                            style={[
                                styles.searchInput,
                                {
                                    backgroundColor: colors.background,
                                    borderColor: colors.borderColor,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="搜索菜系名称..."
                            placeholderTextColor={colors.textLight}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            returnKeyType="search"
                            autoFocus={Platform.OS === 'ios'}
                        />
                    </View>

                    {/* Cuisine List */}
                    {isLoading && displayedCuisines.length === 0 ? (
                        <ActivityIndicator size="large" color={colors.primary} style={styles.fullLoader} />
                    ) : (
                        <FlatList
                            data={displayedCuisines}
                            renderItem={renderCuisineItem}
                            keyExtractor={(item, index) => `${item.name}-${index}-${Math.random()}`}
                            numColumns={3}
                            columnWrapperStyle={styles.row}
                            contentContainerStyle={styles.listContentContainer}
                            showsVerticalScrollIndicator={false}
                            // 移除滑动分页相关的 props
                            // onEndReached={loadMoreItems}
                            // onEndReachedThreshold={0.2}
                            // onMomentumScrollBegin={() => { onEndReachedCalledDuringMomentum.current = false; }}
                            // ListFooterComponent={isLoadingMore ? ... : null} // 不再需要基于 isLoadingMore
                            ListEmptyComponent={
                                !isLoading ? (
                                    <View style={styles.emptyListContainer}>
                                        <ThemedText>未找到菜系。</ThemedText>
                                    </View>
                                ) : null
                            }
                        />
                    )}

                    {/* Pagination Controls */}
                    {totalCuisinesCount > 0 && (
                        <View style={[styles.paginationControls, { borderTopColor: colors.borderColor }]}>
                            <TouchableOpacity
                                onPress={handlePrevPage}
                                disabled={currentPage <= 1 || isLoading}
                                style={[styles.paginationButton, (currentPage <= 1 || isLoading) && styles.paginationButtonDisabled]}
                            >
                                <ThemedText style={styles.paginationButtonText}>上一页</ThemedText>
                            </TouchableOpacity>

                            <ThemedText style={[styles.pageInfoText, {color: colors.textLight}]}>
                                第 {Math.min(currentPage, totalPages || 1)} / {totalPages || 1} 页
                            </ThemedText>

                            <TouchableOpacity
                                onPress={handleNextPage}
                                disabled={currentPage >= totalPages || isLoading}
                                style={[styles.paginationButton, (currentPage >= totalPages || isLoading) && styles.paginationButtonDisabled]}
                            >
                                <ThemedText style={styles.paginationButtonText}>下一页</ThemedText>
                            </TouchableOpacity>
                        </View>
                    )}
                    {/* 如果希望在加载数据时，分页按钮区域也显示加载状态 */}
                    {isLoading && totalCuisinesCount > 0 && (
                        <View style={styles.loadingOverlayForPagination}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '70%',
        borderRadius: Layout.borderRadius.lg,
        overflow: 'hidden', // 对于内部 ScrollView，如果内容超出需要确保不影响圆角
        display: 'flex', // 使用 flex 布局
        flexDirection: 'column', // 子元素垂直排列
        backgroundColor: Colors.common.cardBg, // 确保有背景色
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.md - 2,
        borderBottomWidth: 1,
        flexShrink: 0, // 头部不缩小
    },
    headerTitle: {
        fontSize: Layout.fontSize.lg + 1,
        fontWeight: Layout.fontWeight.semibold,
    },
    closeButton: {
        padding: Layout.spacing.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
        flexShrink: 0, // 搜索框不缩小
    },
    searchIcon: {
        marginRight: Layout.spacing.sm,
    },
    searchInput: {
        flex: 1,
        height: Layout.inputHeight - 4,
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        paddingHorizontal: Layout.spacing.md,
        fontSize: Layout.fontSize.md,
    },
    fullLoader: { // 用于 FlatList 区域的加载指示器
        flex: 1, // 使其在 FlatList 的位置上居中
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContentContainer: { // FlatList 内容的 padding
        paddingHorizontal: Layout.spacing.sm, // 稍微减小一点，因为chip有自己的margin
        paddingVertical: Layout.spacing.sm,
    },
    row: {
        // 如果需要，可以为 numColumns > 1 时的行添加样式
        // justifyContent: 'space-around',
    },
    cuisineChip: {
        // flexGrow: 1, // 对于固定列数，flexGrow 可能不是最佳选择
        // flexBasis: '30%', // 由 numColumns 和间距决定实际宽度，避免写死
        minWidth: (Layout.screen.width * 0.9 * 0.9 / 3) - (Layout.spacing.sm * 2), // 粗略计算，modalContainer 90% 屏宽, listContentContainer 还有 padding
        maxWidth: (Layout.screen.width * 0.9 * 0.9 / 3) - (Layout.spacing.sm * 2),
        margin: Layout.spacing.xs,
        paddingVertical: Layout.spacing.xs + 2,
        paddingHorizontal: Layout.spacing.sm,
        backgroundColor: Colors.common.placeholderBg, // 确保 common 定义
        borderColor: Colors.common.placeholderBg, // 确保 common 定义
        alignItems: 'center', // 使文本居中
        justifyContent: 'center',
    },
    emptyListContainer: {
        flex: 1, // 确保在 FlatList 内部能正确显示
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Layout.spacing.lg,
        minHeight: 100,
    },
    paginationControls: { // 新增样式
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Layout.spacing.sm, // 0.6rem from CSS
        paddingHorizontal: Layout.spacing.md,
        borderTopWidth: 1,
        flexShrink: 0, // 分页控件不缩小
    },
    paginationButton: {
        paddingVertical: Layout.spacing.xs + 2, // 0.45rem
        paddingHorizontal: Layout.spacing.md,    // 1rem
        borderRadius: Layout.borderRadius.md,
        backgroundColor: Colors.common.placeholderBg, // 匹配CSS中的按钮背景
    },
    paginationButtonDisabled: {
        backgroundColor: Colors.common.background, // 更浅的背景
        opacity: 0.6,
    },
    paginationButtonText: {
        fontSize: Layout.fontSize.sm, // 0.85rem
        fontWeight: Layout.fontWeight.medium,
        // color 通过 ThemedText 继承
    },
    pageInfoText: { // 新增样式
        fontSize: Layout.fontSize.sm, // 0.8rem
        fontWeight: Layout.fontWeight.medium,
    },
    loadingOverlayForPagination: { // 可选的，在分页按钮区域显示加载
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50, // 大致等于分页控件高度
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default MoreCuisinesModal;
