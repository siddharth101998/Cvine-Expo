// src/Components/Personalized.js
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { host } from '../../API-info/apiifno';
const Personalized = ({ }) => {
    const navigation = useNavigation();
    const [recommendations, setRecommendations] = useState([]);
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

    return (
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


})