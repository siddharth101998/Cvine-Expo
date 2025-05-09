// src/Components/Personalized.js
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, Image, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { host } from '../../API-info/apiifno';
import { Ionicons } from '@expo/vector-icons';
const Personalized = ({ }) => {
    const navigation = useNavigation();
    const [recommendations, setRecommendations] = useState([]);
    useEffect(() => {
        const fetchStoredRecommendations = async () => {
            try {
                const stored = await AsyncStorage.getItem('wineRecommendations');
                console.log("stored", stored)
                if (stored) {
                    const parsed = JSON.parse(stored);

                    const seen = new Set();
                    const unique = parsed.filter((item) => {
                        if (seen.has(item.bottleId)) {
                            return false; // skip duplicate
                        }
                        seen.add(item.bottleId);
                        return true; // keep unique
                    });

                    setRecommendations(unique);

                }
            } catch (e) {
                console.error('Failed to load stored recommendations', e);
            }
        };

        fetchStoredRecommendations();
    }, []);

    return (
        <ScrollView style={styles.inner}>
            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#555" style={{ marginRight: 4 }} />
                <Text style={styles.infoText}>
                    Your personalized recommendations are generated once per day based on your search history and wishlist bottles.
                </Text>
            </View>
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
                                uri: wine.imageUrl || 'https://via.placeholder.com/300x200?text=Wine+Bottle',
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
};

export default Personalized;

const styles = StyleSheet.create({

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
    noResultText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    inner: {
        padding: 10,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingHorizontal: 4,
    },

    infoText: {
        fontSize: 12,
        color: '#555',
        fontStyle: 'italic',
        flex: 1,
    }

})