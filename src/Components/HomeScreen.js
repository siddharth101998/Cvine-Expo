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
const API_BASE_URL = "http://localhost:5002";
// const API_BASE_URL = 'https://a19b-2601-86-0-1580-e45b-5c-b3e1-ec58.ngrok-free.app';
import { useAuth } from '../authContext/AuthContext';
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
    const handleScan = () => {
        navigation.navigate('Scan');
    };
    useEffect(() => {
        fetchCountries();
        fetchWineTypes();
        fetchGrapeTypes();
        fetchTrending();
        console.log("user details", user)
    }, []);

    const fetchCountries = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/region`);
            setCountries(response.data);
        } catch (error) {
            console.error("Error fetching countries:", error);
        }
    };

    const fetchWineTypes = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/winetype`);
            setWineTypes(response.data);
        } catch (error) {
            console.error("Error fetching wine types:", error);
        }
    };

    const fetchGrapeTypes = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/grapetype`);
            setGrapeTypes(response.data);
        } catch (error) {
            console.error("Error fetching grape types:", error);
        }
    };
    const fetchTrending = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/bottle/trending`);
            setTrending(response.data);
        } catch (error) {
            console.error("Error fetching trending items:", error);
        }
    };



    const fetchBottles = async (query) => {
        if (!query) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/bottle/search`, {
                params: {
                    q: query,
                    country: selectedCountry,
                    winetype: selectedWineType,
                    grapetype: selectedGrapeType,
                },
            });
            setSearchResults(response.data.data);
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
        setLoading(false);
    };

    const debouncedSearch = debounce((query) => {
        fetchBottles(query);
    }, 300);

    const handleSearch = (text) => {
        setSearchText(text);
        debouncedSearch(text);
    };

    const handleBottleClick = (bottleId) => {
        navigation.navigate("Bottle", { id: bottleId });
        console.log("Bottle selected:", bottleId);
    };

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
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <Ionicons name="person-circle" size={28} color="gray" />
                    </TouchableOpacity>
                </View>
            </View>


            <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterToggle}>
                <Ionicons name="filter" size={18} />
                <Text style={styles.filterText}>Toggle Filters</Text>
            </TouchableOpacity>

            {showFilters && (
                <View style={styles.filterContainer}>
                    {/* Country Filter */}
                    <Text style={styles.filterLabel}>Country</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {["", ...countries.map(c => c.country)].map((country) => (
                            <TouchableOpacity
                                key={country}
                                style={[styles.filterOption, selectedCountry === country && styles.selectedOption]}
                                onPress={() => setSelectedCountry(country)}
                            >
                                <Text>{country || "All"}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Wine Type Filter */}
                    <Text style={styles.filterLabel}>Wine Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {["", ...wineTypes.map(w => w.name)].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.filterOption, selectedWineType === type && styles.selectedOption]}
                                onPress={() => setSelectedWineType(type)}
                            >
                                <Text>{type || "All"}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Grape Type Filter */}
                    <Text style={styles.filterLabel}>Grape Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {["", ...grapeTypes.map(g => g.name)].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.filterOption, selectedGrapeType === type && styles.selectedOption]}
                                onPress={() => setSelectedGrapeType(type)}
                            >
                                <Text>{type || "All"}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

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