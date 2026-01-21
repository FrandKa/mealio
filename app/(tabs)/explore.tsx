// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//     StyleSheet,
//     View,
//     ActivityIndicator,
//     Alert,
//     Image,
//     TouchableOpacity,
//     Text as RNText,
//     Platform,
// } from 'react-native';
// import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps';
// import { useRouter } from 'expo-router';
// import * as Location from 'expo-location';
// import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
// import {debounce, random} from 'lodash'; // For debouncing map region changes
//
// import { ThemedView } from '@/components/ThemedView';
// import { ThemedText } from '@/components/ThemedText';
// import StarRating from '@/components/common/StarRating'; // Assuming you have this
// import { Restaurant } from '@/types';
// import { fetchRestaurantsAPI } from '@/services/apiService';
// import Colors from '@/constants/Colors';
// import Layout from '@/constants/Layout';
// import { useColorScheme } from '@/hooks/useColorScheme';
//
// const INITIAL_LATITUDE_DELTA = 0.0922;
// const INITIAL_LONGITUDE_DELTA = 0.0421;
// const NEARBY_DISTANCE_KM = 5; // Distance for API query
// const RESTAURANTS_PER_PAGE = 50; // Fetch more for map view
//
// export default function ExploreScreen() {
//     const router = useRouter();
//     const colorScheme = useColorScheme() ?? 'light';
//     const colors = Colors[colorScheme];
//     const activeTintColor = Colors[colorScheme].tint;
//
//     const [currentUserLocation, setCurrentUserLocation] = useState<Location.LocationObjectCoords | null>(null);
//     const [region, setRegion] = useState<Region | undefined>({
//         latitude: 32.054098, // Default fallback latitude
//         longitude: 118.816616, // Default fallback longitude
//         latitudeDelta: INITIAL_LATITUDE_DELTA,
//         longitudeDelta: INITIAL_LONGITUDE_DELTA,
//     });
//     const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
//     const [isLoadingLocation, setIsLoadingLocation] = useState(true);
//     const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//
//     const mapRef = useRef<MapView>(null);
//
//     // 1. Get User's Current Location
//     useEffect(() => {
//         (async () => {
//             setIsLoadingLocation(true);
//             setError(null);
//             let { status } = await Location.requestForegroundPermissionsAsync();
//             if (status !== 'granted') {
//                 setError('Permission to access location was denied. Please enable it in settings to see nearby restaurants.');
//                 Alert.alert(
//                     "Location Permission Denied",
//                     "Please enable location services for this app in your device settings to use the map feature.",
//                     [{ text: "OK" }]
//                 );
//                 // Set a default region (e.g., a known city center) if permission is denied
//                 setRegion({
//                     latitude: 32.054098, // Default fallback latitude
//                     longitude: 118.816616, // Default fallback longitude
//                     latitudeDelta: INITIAL_LATITUDE_DELTA,
//                     longitudeDelta: INITIAL_LONGITUDE_DELTA,
//                 });
//                 setIsLoadingLocation(false);
//                 return;
//             }
//
//             try {
//                 // Timeout to prevent indefinite loading if location fetch is stuck
//                 const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
//                 const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Location request timed out")), 10000));
//
//                 const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;
//
//                 if (location && location.coords) {
//                     setCurrentUserLocation(location.coords);
//                     const initialRegion = {
//                         latitude: location.coords.latitude,
//                         longitude: location.coords.longitude,
//                         latitudeDelta: INITIAL_LATITUDE_DELTA,
//                         longitudeDelta: INITIAL_LONGITUDE_DELTA,
//                     };
//                     setRegion(initialRegion);
//                     // No need to animate here, map will take initialRegion
//                 } else {
//                     throw new Error("Failed to get location coordinates.");
//                 }
//             } catch (e: any) {
//                 console.warn('Error fetching location for map:', e);
//                 setError(e.message || 'Could not fetch current location. Showing default map area.');
//                 setRegion({ // Fallback region
//                     latitude: 32.054098,
//                     longitude: 118.816616,
//                     latitudeDelta: INITIAL_LATITUDE_DELTA,
//                     longitudeDelta: INITIAL_LONGITUDE_DELTA,
//                 });
//             } finally {
//                 setIsLoadingLocation(false);
//             }
//         })();
//     }, []);
//
//     // 2. Fetch Restaurants when region is set or changes significantly
//     const fetchNearbyRestaurants = useCallback(async (currentMapRegion: Region) => {
//         if (!currentMapRegion) return;
//
//         setIsLoadingRestaurants(true);
//         setError(null);
//         try {
//             const locationString = `${currentMapRegion.longitude},${currentMapRegion.latitude}`;
//             const params = {
//                 page: 1,
//                 per_page: RESTAURANTS_PER_PAGE,
//                 location: locationString,
//                 distance: NEARBY_DISTANCE_KM,
//             };
//             const data = await fetchRestaurantsAPI(params);
//             setRestaurants(data.restaurants || []);
//         } catch (err: any) {
//             console.error("Failed to fetch nearby restaurants:", err);
//             setError(err.message || "Could not load nearby restaurants.");
//             // Optionally show an alert: Alert.alert("Error", "Failed to load restaurants.");
//         } finally {
//             setIsLoadingRestaurants(false);
//         }
//     }, []);
//
//     // Debounced version of fetchNearbyRestaurants
//     const debouncedFetchRestaurants = useCallback(
//         debounce((newRegion: Region) => {
//             fetchNearbyRestaurants(newRegion);
//         }, 1000), // Adjust debounce time as needed (e.g., 1000ms)
//         [fetchNearbyRestaurants] // Dependencies for useCallback
//     );
//
//     useEffect(() => {
//         if (region && !isLoadingLocation) { // Ensure location loading is done
//             fetchNearbyRestaurants(region);
//         }
//     }, [region, isLoadingLocation, fetchNearbyRestaurants]); // fetchNearbyRestaurants is stable due to useCallback
//
//
//     const handleRegionChangeComplete = (newRegion: Region) => {
//         setRegion(newRegion); // Update the current region state
//         debouncedFetchRestaurants(newRegion); // Fetch for the new region
//     };
//
//     const handleCalloutPress = (restaurantId: string) => {
//         router.push({ pathname: '/detail', params: { id: restaurantId } });
//     };
//
//     const handleGoToUserLocation = () => {
//         if (currentUserLocation && mapRef.current) {
//             const userRegion = {
//                 latitude: currentUserLocation.latitude,
//                 longitude: currentUserLocation.longitude,
//                 latitudeDelta: INITIAL_LATITUDE_DELTA, // Zoom back to initial delta
//                 longitudeDelta: INITIAL_LONGITUDE_DELTA,
//             };
//             mapRef.current.animateToRegion(userRegion, 1000);
//         } else if (!currentUserLocation && !isLoadingLocation) {
//             Alert.alert("Location Unavailable", "Could not get your current location. Please ensure location services are enabled.");
//         }
//     };
//
//
//     // if (isLoadingLocation && !region) { // Show full screen loader only if no region is set yet
//     //     return (
//     //         <ThemedView style={styles.centeredLoader}>
//     //             <ActivityIndicator size="large" color={activeTintColor} />
//     //             <ThemedText style={{ marginTop: Layout.spacing.md }}>Fetching your location...</ThemedText>
//     //         </ThemedView>
//     //     );
//     // }
//
//     // Helper to get rating value
//     const getRatingValue = (restaurant: Restaurant) => {
//         return parseFloat(
//             String(restaurant['店铺总分'] ||
//                 (typeof restaurant['店铺均分'] === 'object' && restaurant['店铺均分'] !== null ? restaurant['店铺均分']['口味'] : restaurant['店铺均分']) || 0)
//         );
//     };
//
//
//     return (
//         <ThemedView style={styles.container}>
//             <MapView
//                 ref={mapRef}
//                 style={StyleSheet.absoluteFill}
//                 // provider={PROVIDER_GOOGLE} // Or remove for default provider
//                 initialRegion={region} // Set initial region once
//                 // region={region} // If you want a fully controlled map, use this and onRegionChange
//                 onRegionChangeComplete={handleRegionChangeComplete}
//                 showsUserLocation={true}
//                 showsMyLocationButton={false} // We have a custom one
//                 loadingEnabled={true}
//                 loadingIndicatorColor={activeTintColor}
//                 loadingBackgroundColor={colors.background}
//             >
//                 {restaurants.map((restaurant) => {
//                     if (restaurant['店铺经度'] && restaurant['店铺纬度']) {
//                         return (
//                             <Marker
//                                 key={restaurant._id}
//                                 coordinate={{
//                                     latitude: Number(restaurant['店铺纬度']),
//                                     longitude: Number(restaurant['店铺经度']),
//                                 }}
//                                 tracksViewChanges={false} // 假设你的自定义 Marker 图标在渲染后是静态的
//                                 tracksInfoWindowChanges={false} // 假设 Callout 打开后其内容也是静态的
//                             >
//                                 <View style={[styles.markerContainer, {backgroundColor: activeTintColor}]}>
//                                     <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={Colors.dark.text} />
//                                 </View>
//                                 {/*<Callout tooltip onPress={() => handleCalloutPress(restaurant._id)}>*/}
//                                 {/*    <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 10 }}>*/}
//                                 {/*        <Text>{restaurant['店铺名']}</Text>*/}
//                                 {/*        <Text>点击查看详情</Text>*/}
//                                 {/*    </View>*/}
//                                 {/*</Callout>*/}
//                                 <Callout tooltip onPress={() => handleCalloutPress(restaurant._id)}>
//                                     <View style={[styles.calloutContainer, { backgroundColor: colors.background, shadowColor: colors.text}]}>
//                                         <Image
//                                             source={{ uri: restaurant['图片链接'] || 'https://via.placeholder.com/100x80/E5E7EB/B0B0B0?text=No+Image' }}
//                                             style={styles.calloutImage}
//                                             resizeMode="cover"
//                                         />
//                                         <View style={styles.calloutTextContainer}>
//                                             <ThemedText type="semibold" style={styles.calloutTitle} numberOfLines={1}>
//                                                 {restaurant['店铺名']}
//                                             </ThemedText>
//                                             {restaurant['人均价格'] && (
//                                                 <View style={styles.calloutRow}>
//                                                     <FontAwesome5 name="money-bill-wave" size={12} color={colors.textSubtle} style={styles.calloutIcon} />
//                                                     <ThemedText style={[styles.calloutInfo, {color: colors.text}]}>
//                                                         Avg. ¥{restaurant['人均价格']}
//                                                     </ThemedText>
//                                                 </View>
//                                             )}
//                                             <View style={styles.calloutRow}>
//                                                 <StarRating rating={getRatingValue(restaurant)} starSize={14} />
//                                                 {restaurant['评论总数'] && (
//                                                     <ThemedText style={[styles.calloutReviews, {color: colors.textSubtle}]}>
//                                                         ({restaurant['评论总数']})
//                                                     </ThemedText>
//                                                 )}
//                                             </View>
//                                         </View>
//                                     </View>
//                                 </Callout>
//                             </Marker>
//                         );
//                     }
//                     return null;
//                 })}
//             </MapView>
//
//             {/*{isLoadingRestaurants && (*/}
//             {/*    <View style={styles.loadingOverlay}>*/}
//             {/*        <ActivityIndicator size="small" color={activeTintColor} />*/}
//             {/*        <ThemedText style={{marginLeft: Layout.spacing.sm, fontSize: Layout.fontSize.sm}}>Loading restaurants...</ThemedText>*/}
//             {/*    </View>*/}
//             {/*)}*/}
//             {error && (
//                 <View style={[styles.errorOverlay, {backgroundColor: Colors.common.danger}]}>
//                     <Ionicons name="alert-circle-outline" size={18} color={Colors.dark.text} />
//                     <RNText style={styles.errorText}>{error.length > 70 ? error.substring(0, 70) + '...' : error}</RNText>
//                 </View>
//             )}
//
//             <TouchableOpacity style={[styles.myLocationButton, {backgroundColor: colors.background}]} onPress={handleGoToUserLocation}>
//                 <MaterialCommunityIcons name="crosshairs-gps" size={24} color={activeTintColor} />
//             </TouchableOpacity>
//         </ThemedView>
//     );
// }
//
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//     },
//     centeredLoader: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     markerContainer: {
//         padding: Layout.spacing.xs -2,
//         borderRadius: Layout.borderRadius.full,
//         borderColor: Colors.dark.background, // A slight border for definition
//         borderWidth: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     calloutContainer: {
//         width: 220,
//         padding: Layout.spacing.sm,
//         borderRadius: Layout.borderRadius.lg,
//         // Shadow for elevation (iOS)
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.2,
//         shadowRadius: 4,
//         // Elevation for Android
//         elevation: 5,
//     },
//     calloutImage: {
//         width: '100%',
//         height: 100,
//         borderRadius: Layout.borderRadius.md,
//         marginBottom: Layout.spacing.sm,
//         backgroundColor: Colors.common.placeholderBg,
//     },
//     calloutTextContainer: {
//         // flex: 1, // If image and text are side-by-side
//     },
//     calloutTitle: {
//         fontSize: Layout.fontSize.md,
//         marginBottom: Layout.spacing.xs,
//     },
//     calloutRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: Layout.spacing.xxs,
//     },
//     calloutIcon: {
//         marginRight: Layout.spacing.xs,
//     },
//     calloutInfo: {
//         fontSize: Layout.fontSize.sm,
//     },
//     calloutReviews: {
//         fontSize: Layout.fontSize.xs,
//         marginLeft: Layout.spacing.xs,
//     },
//     loadingOverlay: {
//         position: 'absolute',
//         top: Layout.spacing.md,
//         left: '50%',
//         transform: [{ translateX: -100 }], // Adjust based on typical width
//         width: 200,
//         padding: Layout.spacing.sm,
//         backgroundColor: 'rgba(0,0,0,0.7)',
//         borderRadius: Layout.borderRadius.md,
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         zIndex: 10,
//     },
//     errorOverlay: {
//         position: 'absolute',
//         bottom: Layout.spacing.lg + (Platform.OS === 'ios' ? 20 : 0) + 60, // Above custom tab bar or bottom elements
//         left: Layout.spacing.md,
//         right: Layout.spacing.md,
//         paddingVertical: Layout.spacing.sm,
//         paddingHorizontal: Layout.spacing.md,
//         borderRadius: Layout.borderRadius.md,
//         flexDirection: 'row',
//         alignItems: 'center',
//         zIndex: 10,
//     },
//     errorText: {
//         color: Colors.dark.text,
//         marginLeft: Layout.spacing.sm,
//         flex: 1,
//     },
//     myLocationButton: {
//         position: 'absolute',
//         bottom: Layout.spacing.lg + (Platform.OS === 'ios' ? 20 : 0) + 70, // Adjust if you have a tall tab bar
//         right: Layout.spacing.md,
//         padding: Layout.spacing.sm,
//         borderRadius: Layout.borderRadius.full,
//         elevation: 5,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.2,
//         shadowRadius: 3,
//         zIndex: 10,
//     }
// });
