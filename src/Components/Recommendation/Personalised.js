// src/Components/Personalized.js
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, Image, StyleSheet, View, ActivityIndicator, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { host } from '../../API-info/apiifno';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../authContext/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
const Personalized = ({ }) => {
    const navigation = useNavigation();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
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
    const fetchStoredRecommendations = async () => {
        try {
            // const all = await loadAllRecommendations();
            const raw = await AsyncStorage.getItem('wineRecommendations');
            const parsed = JSON.parse(raw);
            const me = parsed.find(entry => entry.userid === user?._id);
            if (me) {
                const seen = new Set();
                const unique = me.data.filter((item) => {
                    if (seen.has(item.bottleId)) {
                        return false; // skip duplicate
                    }
                    seen.add(item.bottleId);
                    return true; // keep unique
                });

                setRecommendations(unique);

            }
            return;

        } catch (e) {
            console.error('Failed to load stored recommendations', e);
        }
    };
    useFocusEffect(
        React.useCallback(() => {
            fetchStoredRecommendations();
        }, [])
    )


    return (
        <ScrollView style={styles.inner}>
            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#555" style={{ marginRight: 4 }} />
                <Text style={styles.infoText}>
                    Your personalized recommendations are generated once per day based on your search history and wishlist bottles.
                </Text>
            </View>
            {recommendations.length === 0 ? (

                <Text> {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
                    <Text style={styles.noResultText}>Recommednation are Being Fetched.</Text>
                </Text>) : (
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