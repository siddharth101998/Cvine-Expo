import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../authContext/AuthContext';
import { Ionicons } from '@expo/vector-icons';
const API_BASE_URL = "http://localhost:5002";
// const API_BASE_URL = 'https://a19b-2601-86-0-1580-e45b-5c-b3e1-ec58.ngrok-free.app';

const BottlePage = () => {
    const route = useRoute();
    const { user } = useAuth();
    const { id } = route.params;
    const [bottle, setBottle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const capitalizeWords = (str) =>
        str
            ?.toLowerCase()
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    useEffect(() => {
        const fetchBottle = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/bottle/${id}`);
                console.log("bottle res", response.data.data);
                setBottle(response.data.data);
                if (user && response.data?.data?._id) {
                    try {
                    
                        await axios.post(`${API_BASE_URL}/searchHistory/`, {
                            userId: user._id,
                            bottle: response.data.data
                        });

                        const wishlistRes = await axios.get(`${API_BASE_URL}/wishlist/${user._id}`);
                        const wishlist = wishlistRes.data?.bottles || [];
                        const found = wishlist.find(item => item._id === response.data.data._id);
                        setIsWishlisted(!!found);
                    } catch (err) {
                        console.error('Wishlist or history fetch failed:', err);
                    }
                }
            } catch (err) {
                setError('Failed to load bottle details.');
            } finally {
                setLoading(false);
            }
        };

        fetchBottle();
    }, [id]);

    const toggleWishlist = async () => {
        if (!user) return;
        try {
            await axios.post(`${API_BASE_URL}/wishlist/toggle`, {
                userId: user._id,
                bottleId: bottle._id
            });
            console.log("wishlist", !isWishlisted);
            setIsWishlisted(prev => !prev);
        } catch (err) {
            console.error('Failed to toggle wishlist:', err);
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#b22222" />;
    if (error) return <Text style={styles.error}>{error}</Text>;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.centeredContent}>
                <Text style={styles.bottleName}>{bottle.name}</Text>
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: bottle.imageUrl }} style={styles.image} resizeMode="contain" />
                    <TouchableOpacity onPress={toggleWishlist} style={styles.heartIcon}>
                        <Ionicons
                            name={isWishlisted ? 'heart' : 'heart-outline'}
                            size={28}
                            color="#B22222"
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.descriptionText} numberOfLines={showFullDesc ? undefined : 4}>
                    {bottle.fullDescription}
                </Text>

                <Text onPress={() => setShowFullDesc(!showFullDesc)} style={styles.readMore}>
                    {showFullDesc ? 'Show Less' : 'Read More'}
                </Text>

                <View style={styles.infoGrid}>
                    <View style={styles.infoColumn}><Text style={styles.label}>GRAPE</Text><Text style={styles.value}>{capitalizeWords(bottle.grapeType)}</Text></View>
                    <View style={styles.infoColumn}><Text style={styles.label}>ALCOHOL</Text><Text style={styles.value}>{bottle.alcoholContent}</Text></View>
                    <View style={styles.infoColumn}><Text style={styles.label}>BRAND</Text><Text style={styles.value}>{bottle.Winery}</Text></View>
                    <View style={styles.infoColumn}><Text style={styles.label}>PRICE</Text><Text style={styles.value}>{bottle.price}</Text></View>
                    <View style={styles.infoColumn}><Text style={styles.label}>RATING</Text><Text style={styles.value}>{bottle.avgRating}</Text></View>
                    <View style={styles.infoColumn}><Text style={styles.label}>REGION</Text><Text style={styles.value}>{bottle.region}</Text></View>
                    <View style={styles.infoColumn}><Text style={styles.label}>COUNTRY</Text><Text style={styles.value}>{bottle.country}</Text></View>
                    <View style={styles.infoColumn}><Text style={styles.label}>TYPE</Text><Text style={styles.value}>{bottle.wineType}</Text></View>
                </View>
            </View>
        </ScrollView>
    );
};

export default BottlePage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fcf8f5',
        top: 50
    },
    centeredContent: {
        padding: 20,
        alignItems: 'center',
    },
    image: {
        width: 200,
        height: 360,
        marginVertical: 20,
    },
    bottleName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#3e3e3e',
        marginBottom: 5,
    },
    descriptionText: {
        fontSize: 16,
        color: '#4f4f4f',
        lineHeight: 24,
        marginBottom: 2,
        textAlign: 'justify',
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 16,
        columnGap: 16,
        width: '100%',
    },
    infoColumn: {
        width: '47%',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        color: '#9b9b9b',
        fontWeight: '600',
    },
    value: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#222',
        marginTop: 4,
        textAlign: 'center',

    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: 50,
    },
    readMore: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#B22222',
        marginTop: 4,
        textAlign: 'center',
        marginBottom: 10
    },
    imageWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    heartIcon: {
        position: 'absolute',
        top: 0,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 4,
        elevation: 3,
    },
});

