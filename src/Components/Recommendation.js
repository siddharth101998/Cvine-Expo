import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Dimensions,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../authContext/AuthContext';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import debounce from 'lodash.debounce';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform } from 'react-native';
const API_BASE_URL = 'http://localhost:5002'; // Update for production

const Recommendation = ({ }) => {
    const layout = Dimensions.get('window');
    const { user } = useAuth();
    const userId = user?._id;

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'personalized', title: 'Personalized' },
        { key: 'get', title: 'Get Recommendations' },
    ]);

    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedBottles, setSelectedBottles] = useState([]);
    const [getrecommendations, setGetRecommendations] = useState([]);
    const navigation = useNavigation();
    useEffect(() => {
        const fetchStoredRecommendations = async () => {
            try {
                const stored = await AsyncStorage.getItem('wineRecommendations');
                if (stored) {
                    console.log("recommmm", JSON.parse(stored))
                    setRecommendations(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Failed to load stored recommendations', e);
            }
        };

        fetchStoredRecommendations();
    }, []);

    const fetchSearchResults = async (query) => {
        if (!query) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/bottle/search`, {
                params: { q: query },
            });
            setSearchResults(response.data.data);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
        setLoading(false);
    };

    const debouncedSearch = debounce((query) => {
        fetchSearchResults(query);
    }, 300);

    const handleSearch = (text) => {
        setSearchText(text);
        debouncedSearch(text);
    };

    const handleBottleSelect = (bottle) => {
        if (!selectedBottles.find((b) => b._id === bottle._id)) {
            setSelectedBottles([...selectedBottles, bottle]);
        }
    };

    const handleGetRecommendations = async () => {
        if (selectedBottles.length === 0) {
            alert('Please select at least one bottle.');
            return;
        }
        setLoading(true);
        try {
            const bottleNames = selectedBottles.map((b) => b.name);
            const response = await axios.post(`${API_BASE_URL}/api/recommend`, {
                selectedBottles: bottleNames,
            });
            setGetRecommendations(response.data.recommendations);
            await AsyncStorage.setItem(
                'wineRecommendations',
                JSON.stringify(response.data.recommendations)
            );
            setIndex(0); // Switch to Personalized tab to view recommendations
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        }
        setLoading(false);
    };

    const PersonalizedRoute = () => (
        <ScrollView style={styles.inner}>
            {recommendations.length === 0 ? (
                <Text style={styles.noResultText}>No recommendations yet.</Text>
            ) : (
                recommendations.map((wine) => (
                    <TouchableOpacity
                        key={wine.bottleId}
                        style={styles.card}
                        onPress={() =>
                            navigation.navigate("Bottle", { id: wine.bottleId })
                        }
                    >
                        <Image
                            source={{
                                uri:
                                    wine.imageUrl ||
                                    'https://via.placeholder.com/300x200?text=Wine+Bottle',
                            }}
                            style={styles.wineImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.wineName}>{wine.bottleName}</Text>
                        <Text style={styles.wineExplanation}>{wine.explanation}</Text>
                    </TouchableOpacity>
                ))
            )}
        </ScrollView>
    );

    const GetRoute = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1 }}>
                {/* Search Field - OUTSIDE ScrollView */}
                <View style={[styles.inner, { paddingBottom: 0 }]}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={20} color="gray" style={{ marginRight: 8 }} />
                        <TextInput
                            placeholder="Search for a wine..."
                            value={searchText}
                            onChangeText={handleSearch}
                            style={styles.input}
                        />
                    </View>
                </View>

                {/* Scrollable Area */}
                <View>
                    {/* Selected Bottles */}
                    {selectedBottles.length > 0 && (
                        <View style={styles.selectedContainer}>
                            <Text style={styles.selectedTitle}>Selected Bottles:</Text>
                            {selectedBottles.map((bottle) => (
                                <Text key={bottle._id} style={styles.selectedBottle}>• {bottle.name}</Text>
                            ))}
                            <TouchableOpacity style={styles.addButton} onPress={handleGetRecommendations}>
                                <Text style={styles.addButtonText}>Get Recommendations</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Search Results Dropdown */}
                    <View style={{ maxHeight: 200 }}>

                        {searchResults.map((item) => (
                            <TouchableOpacity
                                key={item._id}
                                style={styles.resultBox}
                                onPress={() => handleBottleSelect(item)}
                            >
                                <View style={styles.resultRow}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.bottleImage} />
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={styles.resultTitle}>{item.name}</Text>
                                        <Text style={styles.resultSubtitle}>{item.winery}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}

                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'personalized':
                return <PersonalizedRoute />;
            case 'get':
                return <GetRoute />;
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Wine Recommendations</Text>
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={(props) => (
                    <TabBar
                        {...props}
                        indicatorStyle={{ backgroundColor: '#b22222' }}
                        style={{ backgroundColor: 'black' }}
                        labelStyle={{ color: '#000', fontSize: 14, fontWeight: 'bold', textTransform: 'none' }}
                    />
                )}
                animationEnabled={false}
                keyboardDismissMode="none"
            />
        </View>
    );
};

export default Recommendation;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fcf8f5',
        paddingTop: 50,
    },
    inner: {
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: '600',
        color: '#3e3e3e',
        marginBottom: 10,
        textAlign: 'center',
    },
    addButton: {
        backgroundColor: '#2E8B57',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noResultText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
        elevation: 2,
        alignItems: 'center',
    },
    wineImage: {
        width: '100%',
        height: 200,
        marginBottom: 12,
    },
    wineName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E2E2E',
        marginBottom: 8,
        textAlign: 'center',
    },
    wineExplanation: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
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
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bottleImage: {
        width: 50,
        height: 50,
        borderRadius: 6,
        backgroundColor: '#eee',
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultSubtitle: {
        fontSize: 14,
        color: 'gray',
    },
    selectedContainer: {
        marginTop: 20,
    },
    selectedTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    selectedBottle: {
        fontSize: 14,
        color: '#333',
    },
});