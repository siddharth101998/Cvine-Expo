import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
//import { useAuth } from '../authContext/AuthContext'
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import debounce from 'lodash.debounce';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { host } from '../API-info/apiifno';
const MemoizedTextInput = React.memo(({ value, onChangeText, ...props }) => (
    <TextInput
        value={value}
        onChangeText={onChangeText}
        {...props}
    />
));
const Recommendation = ({ }) => {
    const layout = Dimensions.get('window');
    //const { user } = useAuth();
    //const userId = user?._id;

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
    const [showSearch, setShowSearch] = useState(true);
    const navigation = useNavigation();
    useEffect(() => {
        const fetchStoredRecommendations = async () => {
            try {
                const stored = await AsyncStorage.getItem('wineRecommendations');
                const recstored = await AsyncStorage.getItem('getwineRecommendations');
                if (stored) {
                    console.log("recommmm", JSON.parse(stored))
                    setRecommendations(JSON.parse(stored));
                }
                if (recstored) {

                    setGetRecommendations(JSON.parse(recstored));
                    setShowSearch(false);
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
            const response = await axios.get(`${host}/bottle/search`, {
                params: { q: query },
            });
            setSearchResults(response.data.data);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
        setLoading(false);
    };

    const debouncedSearch = useMemo(() => debounce((query) => {
        fetchSearchResults(query);
    }, 300), []);

    const handleSearch = useCallback((text) => {
        setSearchText(text);
        debouncedSearch(text);
    }, []);

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
        // const today = new Date().toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'
        // const usageKey = 'recommendationUsage';

        try {
            // const usageData = await AsyncStorage.getItem(usageKey);
            // let usage = usageData ? JSON.parse(usageData) : { date: today, count: 0 };

            // if (usage.date !== today) {
            //     // Reset count for a new day
            //     usage = { date: today, count: 0 };
            // }

            // if (usage.count >= 3) {
            //     alert('Your free daily recommendations are finished. Upgrade to premium to get more recommendations.');
            //     return;
            // }
            setLoading(true);
            const bottleNames = selectedBottles.map((b) => b.name);
            const response = await axios.post(`${host}/api/recommend`, {
                selectedBottles: bottleNames,
            });
            setGetRecommendations(response.data.recommendations);
            await AsyncStorage.setItem(
                'getwineRecommendations',
                JSON.stringify(response.data.recommendations)
            );
            usage.count += 1;
            await AsyncStorage.setItem(usageKey, JSON.stringify(usage));
            setShowSearch(false);
            setSelectedBottles([]);
            setSearchText('');
            setSearchResults([]);
            //setIndex(0); // Switch to Personalized tab to view recommendations
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        }
        setLoading(false);
    };
    const handleNewRecommendation = async () => {

        try {
            const today = new Date().toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'
            const usageKey = 'recommendationUsage';
            const usageData = await AsyncStorage.getItem(usageKey);
            let usage = usageData ? JSON.parse(usageData) : { date: today, count: 0 };
            if (usage.date !== today) {
                // Reset count for a new day
                usage = { date: today, count: 0 };
            }

            if (usage.count >= 4) {
                alert('Your free daily recommendations are finished. Upgrade to premium to get more recommendations.');
                return;
            }
            else {
                setShowSearch(true);
                setSelectedBottles([]);
                setSearchText('');
                setSearchResults([]);
                setGetRecommendations([]);
            }


        } catch (error) {
            console.log("error in async storage usage checking", error)
        }

    };
    const handleshowRecommendations = () => {
        setShowSearch(false);
        handleGetRecommendations()
        setSelectedBottles([]);
        setSearchText('');
        setSearchResults([]);

    }


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
                {showSearch ? (
                    <>
                        <View style={[styles.inner, { paddingBottom: 0 }]}>
                            <View style={styles.searchBox}>
                                <Ionicons
                                    name="search"
                                    size={20}
                                    color="gray"
                                    style={{ marginRight: 8 }}
                                />
                                <MemoizedTextInput
                                    placeholder="Search for a wine..."
                                    value={searchText}
                                    onChangeText={handleSearch}
                                    style={styles.input}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={handleshowRecommendations}
                            >
                                <Text style={styles.addButtonText}>Search Recommendations</Text>
                            </TouchableOpacity>
                        </View>

                        <View>
                            {selectedBottles.length > 0 && (
                                <View style={styles.selectedContainer}>
                                    <Text style={styles.selectedTitle}>Selected Bottles:</Text>
                                    {selectedBottles.map((bottle) => (
                                        <Text key={bottle._id} style={styles.selectedBottle}>
                                            • {bottle.name}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            <View style={{ maxHeight: 200 }}>
                                {searchResults.map((item) => (
                                    <TouchableOpacity
                                        key={item._id}
                                        style={styles.resultBox}
                                        onPress={() => handleBottleSelect(item)}
                                    >
                                        <View style={styles.resultRow}>
                                            <Image
                                                source={{ uri: item.imageUrl }}
                                                style={styles.bottleImage}
                                            />
                                            <View style={{ marginLeft: 10 }}>
                                                <Text style={styles.resultTitle}>{item.name}</Text>
                                                <Text style={styles.resultSubtitle}>{item.winery}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.inner}>
                        {loading && (
                            <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
                        )}
                        {!loading && (<TouchableOpacity
                            style={styles.addButton}
                            onPress={handleNewRecommendation}
                        >
                            <Text style={styles.addButtonText}>Get New Recommendations</Text>
                        </TouchableOpacity>)}


                        <ScrollView style={styles.inner}>
                            {
                                getrecommendations.map((wine, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.card}
                                        onPress={() =>
                                            navigation.navigate('Bottle', { id: wine.bottleId })
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
                                        <Text style={styles.wineExplanation}>
                                            {wine.explanation}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            }</ScrollView>
                    </View>
                )}
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