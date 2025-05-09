// src/Components/Recommendation/GetRecommendation.js
import React, { useState, useEffect, useMemo, useCallback, } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Image,
    KeyboardAvoidingView, Platform, ActivityIndicator, TextInput, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

import { host } from '../../API-info/apiifno';
const GetRecommendation = ({ }) => {
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedBottles, setSelectedBottles] = useState([]);
    const [getrecommendations, setGetRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSearch, setShowSearch] = useState(true);
    const navigation = useNavigation();
    const usageKey = 'recommendationUsage';

    // Helper to load & reset usage if needed
    async function loadUsage() {
        const today = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
        const raw = await AsyncStorage.getItem(usageKey);
        let usage = raw ? JSON.parse(raw) : { date: today, count: 0 };

        if (usage.date !== today) {
            usage = { date: today, count: 0 };
            await AsyncStorage.setItem(usageKey, JSON.stringify(usage));
        }
        console.log("usage", usage);
        return usage;
    }
    useEffect(() => {
        const fetchStoredRecommendations = async () => {
            try {
                const recstored = await AsyncStorage.getItem('getwineRecommendations');

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

    const debouncedSearch = useMemo(() => {
        let timeoutId;
        return (query) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                fetchSearchResults(query);
            }, 500);
        };
    }, []);

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
        try {
            const start = Date.now(); // Start timer
            console.log("Fetching recomendation bottles...");
            const today = new Date().toLocaleDateString('en-CA'); // Format: 'YYYY-MM-DD'
            const usage = await loadUsage();
            if (usage.count >= 3) {
                alert('Your free daily recommendations are finished. Upgrade to premium to get more.');
                return;
            }

            setLoading(true);
            const bottleNames = selectedBottles.map((b) => b.name);
            const response = await axios.post(`${host}/api/recommend`, {
                selectedBottles: bottleNames,
            });

            setGetRecommendations(response.data.recommendations);
            const end = Date.now(); // End timer
            const duration = end - start;
            console.log("Fetched Recommendation in ", duration, "ms");
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
        const today = new Date().toLocaleDateString('en-CA'); // Format: 'YYYY-MM-DD'
        console.log("tdoay", today)
        const usageKey = 'recommendationUsage';
        try {
            const usage = await loadUsage();
            if (usage.count >= 3) {
                alert('Your free daily recommendations are finished. Upgrade to premium to get more.');
                return;
            }

            console.log("dddddd")
            setShowSearch(true);
            setSelectedBottles([]);
            setSearchText('');
            setSearchResults([]);
            setGetRecommendations([]);



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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1 }}>
                {showSearch ? (
                    <View style={{ flex: 1 }}>
                        <View style={[localStyles.inner, { paddingBottom: 0 }]}>
                            <View style={localStyles.searchBox}>
                                <Ionicons name="search" size={20} color="gray" style={{ marginRight: 8 }} />
                                <TextInput
                                    placeholder="Search for a wine..."
                                    value={searchText}
                                    onChangeText={handleSearch}
                                    style={localStyles.input}
                                    autoFocus={true}

                                />
                            </View>
                            <TouchableOpacity
                                style={localStyles.addButton}
                                onPress={handleshowRecommendations}
                            >
                                <Text style={localStyles.addButtonText}>Search Recommendations</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedBottles.length > 0 && (
                            <View style={localStyles.selectedContainer}>
                                <Text style={localStyles.selectedHeading}>Selected Bottles</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {selectedBottles.map((bottle) => (
                                        <Image
                                            key={bottle._id}
                                            source={{ uri: bottle.imageUrl }}
                                            style={localStyles.selectedBottleImage}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <ScrollView style={{ maxHeight: 500 }}>
                            {searchResults.map((item) => (
                                <TouchableOpacity
                                    key={item._id}
                                    style={localStyles.resultBox}
                                    onPress={() => handleBottleSelect(item)}
                                >
                                    <View style={localStyles.resultRow}>
                                        <Image source={{ uri: item.imageUrl }} style={localStyles.bottleImage} />
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={localStyles.resultTitle}>{item.name}</Text>

                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                ) : (
                    <View style={localStyles.inner}>
                        {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
                        {!loading && (
                            <TouchableOpacity
                                style={localStyles.addButton}
                                onPress={handleNewRecommendation}
                            >
                                <Text style={localStyles.addButtonText}>Get New Recommendations</Text>
                            </TouchableOpacity>
                        )}
                        <ScrollView style={localStyles.inner}>
                            {getrecommendations.map((wine, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={localStyles.card}
                                    onPress={() => navigation.navigate('Bottle', { id: wine.bottleId })}
                                >
                                    <Image
                                        source={{
                                            uri: wine.imageUrl || 'https://via.placeholder.com/300x200?text=Wine+Bottle',
                                        }}
                                        style={localStyles.wineImage}
                                        resizeMode="contain"
                                    />
                                    <Text style={localStyles.wineName}>{wine.bottleName}</Text>
                                    <Text style={localStyles.wineExplanation}>{wine.explanation}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const localStyles = StyleSheet.create({
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginHorizontal: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    resultBox: {
        backgroundColor: '#fff',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bottleImage: {
        width: 50,
        height: 50,
        borderRadius: 4,
        objectFit: 'contain'
    },
    resultTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    resultSubtitle: {
        color: '#666',
        fontSize: 14,
    },
    selectedHeading: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 10,
        color: '#333',
    },
    selectedContainer: {
        marginVertical: 10,
        paddingVertical: 10,
        backgroundColor: '#fff8f2',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    selectedBottleImage: {
        width: 50,
        height: 50,
        borderRadius: 6,
        marginHorizontal: 5,
        objectFit: 'contain'
    },
    addButton: {
        backgroundColor: '#B22222',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',

    }, inner: {
        padding: 10,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
});

export default GetRecommendation;