import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Platform,
    Image // <-- Add this
} from 'react-native';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import logo from '../../assets/logo.png';
import LoginPrompt from './LoginPrompt';
import { logoutUser } from '../../authservice';

import { host } from '../API-info/apiifno';
import { useAuth } from '../authContext/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
const HomeScreen = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [countries, setCountries] = useState([]);
    const [wineTypes, setWineTypes] = useState([]);
    const [grapeTypes, setGrapeTypes] = useState([]);
    const [trending, setTrending] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedWineType, setSelectedWineType] = useState('');
    const [selectedGrapeType, setSelectedGrapeType] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const navigation = useNavigation();
    const { user, updateUser } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const handleScan = () => {
        navigation.navigate('Scan');
    };
    useEffect(() => {
        fetchTrending();
    }, []);
    useEffect(() => {
        if (user) { fetchUserRecommendations(user?._id) }

    }, [user])
    const loadAllRecommendations = async () => {
        try {
            const raw = await AsyncStorage.getItem('wineRecommendations');
            if (!raw) return [];

            const parsed = JSON.parse(raw);

            // if it’s already an array, use it
            if (Array.isArray(parsed)) {
                return parsed;
            }

            // if it’s a lone object { userid, data }, wrap it
            if (parsed && parsed.userid && parsed.data) {
                return [parsed];
            }

            // otherwise, no usable data
            return [];
        } catch (e) {
            console.error('Failed to parse stored recommendations:', e);
            return [];
        }
    };
    const fetchUserRecommendations = async (userId) => {
        try {
            const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
            const key = `hasFetchedRecommendations_${user?._id}_${today}`;


            // see if we've already fetched today
            const alreadyFetched = await AsyncStorage.getItem(key);
            if (alreadyFetched === 'true') {
                console.log('Recommendations already fetched for user today.');
                return;
            }
            console.log('fetching')
            const searchRes = await axios.get(`${host}/searchHistory/${userId}`);
            const searchHistory = searchRes.data || [];

            const wishlistRes = await axios.get(`${host}/wishlist/${userId}`);
            const wishlist = wishlistRes.data.bottles || [];

            const recentSearches = searchHistory
                .slice(-3)
                .map(entry => entry.bottle?.name)
                .filter(Boolean);

            const shuffledWishlist = wishlist.sort(() => 0.5 - Math.random());
            const wishlistSelections = shuffledWishlist
                .map(bottle => bottle.name)
                .filter(Boolean)
                .slice(0, 7);

            let selectedBottles = [...recentSearches, ...wishlistSelections];
            const SAMPLE_BOTTLES = [
                "Château Lafite Rothschild 2015",
                "Opus One 2016",
                "Dominus Estate 2014",
                "Screaming Eagle Cabernet Sauvignon 2012",
                "Caymus Special Selection 2015",
                "Silver Oak Cabernet Sauvignon 2017",
                "Cakebread Cellars Chardonnay 2018",
                "Rombauer Chardonnay 2019",
                "Domaine Leflaive Puligny-Montrachet 2017",
                "Kistler Vineyards Chardonnay 2018",
                "Cakebread Cellars Sauvignon Blanc 2020",
                "Cloudy Bay Sauvignon Blanc 2020"
            ];
            const needed = 10 - selectedBottles.length;
            if (needed > 0) {
                const fallback = SAMPLE_BOTTLES.filter(name => !selectedBottles.includes(name));
                selectedBottles = [...selectedBottles, ...fallback.slice(0, needed)];
            }

            const recRes = await axios.post(`${host}/api/recommend`, { selectedBottles });
            console.log("recieved recomendation");
            const recommendations = recRes.data.recommendations || [];
            const all = await loadAllRecommendations();
            const filtered = all.filter(entry => entry.userid !== user?._id);

            // 3) add the new one
            filtered.push({
                userid: user?._id,
                data: recommendations
            });
            await AsyncStorage.setItem('wineRecommendations', JSON.stringify(filtered));
            console.log("recieved success");
            await AsyncStorage.setItem(key, 'true'); // Mark as fetched
        } catch (error) {
            console.error('Error fetching personalized recommendations:', error);
        }
    };

    const handlelogout = async () => {
        try {
            //await logoutUser();
            updateUser(null);
            navigation.navigate('Login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    const fetchGuestRecommendations = async (userId) => {
        try {


            const SAMPLE_BOTTLES = [
                "Château Lafite Rothschild 2015",
                "Opus One 2016",
                "Dominus Estate 2014",
                "Screaming Eagle Cabernet Sauvignon 2012",
                "Caymus Special Selection 2015",
                "Silver Oak Cabernet Sauvignon 2017",
                "Cakebread Cellars Chardonnay 2018",
                "Rombauer Chardonnay 2019",
                "Domaine Leflaive Puligny-Montrachet 2017",
                "Kistler Vineyards Chardonnay 2018",
                "Cakebread Cellars Sauvignon Blanc 2020",
                "Cloudy Bay Sauvignon Blanc 2020"
            ];

            const recRes = await axios.post(`${host}/api/recommend`, { selectedBottles: SAMPLE_BOTTLES });
            const recommendations = recRes.data.recommendations || [];
            await AsyncStorage.setItem('wineRecommendations', JSON.stringify(recommendations));
        } catch (error) {
            console.error('Error fetching personalized recommendations:', error);
        }
    };
    const fetchTrending = async () => {
        try {


            const response = await axios.get(`${host}/bottle/trending`);

            setTrending(response.data);

        } catch (error) {
            console.error("Error fetching trending items:", error);
        }
    };

    const handleBottleClick = (bottleId) => {
        navigation.navigate("Bottle", { id: bottleId });
        console.log("Bottle selected:", bottleId);
    };

    const handleprofile = () => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }
        navigation.navigate('Profile')
    }

    return (
        <ScrollView style={styles.container}>
            {/* <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="gray" style={{ marginRight: 8 }} />
                <TextInput
                    placeholder="Search for a wine..."
                    value={searchText}
                    onChangeText={handleSearch}
                    style={styles.input}
                />
            </View>

            {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}

            
            {searchResults.slice(0, 3).map((item) => (
                <TouchableOpacity key={item._id} style={styles.resultBox} onPress={() => handleBottleClick(item._id)}>
                    <Text>{item.name}</Text>
                    <Text>{item.winery}</Text>
                </TouchableOpacity>
            ))} */}
            <View style={styles.logoContainer}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
                <View style={styles.iconGroup}>
                    <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                        <Ionicons name="search" size={24} color="gray" style={{ marginRight: 15 }} />
                    </TouchableOpacity>
                    {/* <TouchableOpacity onPress={handlelogout}>
                        <Ionicons name="log-out" size={24} color="gray" style={{ marginRight: 15 }} />
                    </TouchableOpacity> */}
                    <TouchableOpacity onPress={handleprofile}>

                        <Ionicons name="person-circle" size={28} color="gray" />
                    </TouchableOpacity>
                </View>
            </View>


            {/* Trending Section */}
            <Text style={[styles.filterLabel, { marginTop: 20 }]}>Trending Wines</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingVertical: 10 }}>
                {trending.data?.map((item) => (
                    <TouchableOpacity
                        key={item._id}
                        onPress={() => handleBottleClick(item._id)}
                        style={[styles.trendingItem, { marginBottom: 12 }]}
                    >
                        <View style={styles.trendingImageBox}>
                            <Image
                                source={{ uri: item.imageUrl }}
                                style={styles.trendingImage}
                                resizeMode="cover"
                            />
                        </View>
                        <Text style={styles.trendingName} numberOfLines={2}>{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <LoginPrompt visible={showLoginModal} onClose={() => setShowLoginModal(false)} />

        </ScrollView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        padding: 16,
        paddingTop: 5,
        top: 70,

    },
    searchBox: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    resultBox: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultSubtitle: {
        fontSize: 14,
        color: 'gray',
    },
    filterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    filterText: {
        marginLeft: 6,
        fontWeight: 'bold',
    },
    filterContainer: {
        marginTop: 10,
    },
    filterLabel: {
        fontWeight: 'bold',
        marginBottom: 6,
    },
    filterOption: {
        backgroundColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 10,
    },
    selectedOption: {
        backgroundColor: '#b22222',
        color: '#fff',
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#b22222',
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 20,
    },
    scanText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    trendingItem: {
        width: 170,

        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 8,
        elevation: 2,

    },
    trendingImageBox: {

        height: 150,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 8,
    },
    trendingImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain'
    },
    trendingName: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center'
    },
    logoContainer: {
        display: 'flex',
        flexDirection: 'row',
        //marginBottom: 10,
        justifyContent: 'space-between',
        alignItems: 'center',

    },
    logo: {
        width: 60,
        height: 50,
    },
    iconGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});