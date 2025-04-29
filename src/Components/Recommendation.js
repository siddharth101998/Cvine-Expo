import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = 'http://localhost:5002'; // Update for production

const Recommendation = ({ navigation }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStoredRecommendations = async () => {
            try {
                const stored = await AsyncStorage.getItem('wineRecommendations');
                if (stored) {
                    setRecommendations(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Failed to load stored recommendations', e);
            }
        };

        fetchStoredRecommendations();
    }, []);

    const recommendWine = async () => {
        const selectedBottles = [
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

        if (selectedBottles.length === 0) {
            alert("Please select bottles first.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/recommend`, { selectedBottles });
            setRecommendations(response.data.recommendations);
            await AsyncStorage.setItem('wineRecommendations', JSON.stringify(res.data.recommendations));
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#b22222" />;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.inner}>
                <Text style={styles.header}>Wine Recommendations</Text>

                <TouchableOpacity style={styles.addButton} onPress={recommendWine}>
                    <Text style={styles.addButtonText}>Get Recommendations</Text>
                </TouchableOpacity>

                {recommendations.length === 0 ? (
                    <Text style={styles.noResultText}>No recommendations yet.</Text>
                ) : (
                    recommendations.map((wine) => (
                        <TouchableOpacity
                            key={wine.bottleId}
                            style={styles.card}
                            onPress={() => navigation.navigate('BottlePage', { id: wine.bottleId })}
                        >
                            <Image
                                source={{ uri: wine.imageUrl || "https://via.placeholder.com/300x200?text=Wine+Bottle" }}
                                style={styles.wineImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.wineName}>{wine.bottleName}</Text>
                            <Text style={styles.wineExplanation}>{wine.explanation}</Text>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

export default Recommendation;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fcf8f5',
    },
    inner: {
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: '600',
        color: '#3e3e3e',
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: '#2E8B57',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
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
});