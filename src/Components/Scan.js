import React, { useState, useEffect } from 'react';
import { View, Image, Alert, ActivityIndicator, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase';
import axios from 'axios';
import { host } from '../API-info/apiifno';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
//let pendingUri = null;

export const handleScan = async (navigation) => {

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
        Alert.alert('Permission required', 'Camera access is needed to scan labels.');
        return;
    }

    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    navigation.navigate('Home');
    if (!result.canceled) {
        uri = result.assets[0].uri;

        navigation.navigate('Scan', { uri });

    }
};

const ScanScreen = () => {
    const { params } = useRoute();
    const { uri } = params || {};
    const [imageUri, setImageUri] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [wineDetails, setWineDetails] = useState(null);
    const navigation = useNavigation();
    const handleBottleClick = (bottleId) => {
        navigation.navigate("Bottle", { id: bottleId });
        console.log("Bottle selected:", bottleId);
    };
    useEffect(() => {
        if (uri) {
            setImageUri(uri);
            uploadAndProcessImage(uri);
        }
    }, [uri]);

    const uploadAndProcessImage = async (uri) => {
        try {
            if (!uri) throw new Error('Image URI is undefined');
            setProcessing(true);
            //setWineDetails([]);
            const blob = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = () => resolve(xhr.response);
                xhr.onerror = () => reject(new Error('Failed to convert URI to Blob'));
                xhr.responseType = 'blob';
                xhr.open('GET', uri, true);
                xhr.send(null);
            });

            const fileName = uri.split('/').pop();
            const storageRef = ref(storage, `uploaded_images/${Date.now()}-${fileName}`);
            await uploadBytes(storageRef, blob);

            const downloadUrl = await getDownloadURL(storageRef);
            const res = await axios.post(`${host}/process-image`, { imageUrl: downloadUrl });
            setWineDetails(res.data.length ? res.data : []);

        } catch (err) {
            console.error('Upload error:', err);
            Alert.alert('Upload Failed', err.message || 'There was a problem uploading the image.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.headerText}>Find Your Wine </Text>
            </View>
            {imageUri && processing && (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.preview} />
                </View>
            )}

            {processing && (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#B22222" />
                    <Text style={styles.loadingText}>Scanning your wine...</Text>
                </View>
            )}
            {!processing && (<>
                {wineDetails && Array.isArray(wineDetails) && wineDetails.length === 0 && (
                    <View style={styles.noResultBox}>
                        <Text style={styles.noResultText}>
                            Wine not found. The photo may be blurry or not wine-related.
                        </Text>
                    </View>
                )}
                {wineDetails && Array.isArray(wineDetails) && wineDetails.length > 0 && (
                    <View style={styles.listWrapper}>
                        <ScrollView contentContainerStyle={styles.scrollInner}>
                            <View style={{ display: 'flex', flex: 'row', mb: 5 }}>
                                <Text>
                                    <Text style={styles.didYouMeanText}>Did you mean: </Text>
                                    <Text style={styles.highlightedName}>{wineDetails[0].name}?</Text>
                                </Text>
                            </View>


                            <View style={styles.cardsWrapper}>
                                {wineDetails.map((bottle, index) => (
                                    <TouchableOpacity key={bottle._id}
                                        onPress={() => handleBottleClick(bottle._id)}
                                    >

                                        <View key={index} style={styles.card}>
                                            <Image source={{ uri: bottle.imageUrl }} style={styles.cardImage} />
                                            <Text style={styles.cardTitle}>{bottle.name}</Text>
                                        </View>

                                    </TouchableOpacity>

                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}</>)}

        </View>
    );
};

export default ScanScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fcf8f5',
        alignItems: 'center',

    },

    header: {
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#B22222',
        alignItems: 'center',
        width: '100%'
    },
    headerText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    imageContainer: {
        borderWidth: 2,
        borderColor: '#DDD',
        borderRadius: 12,
        padding: 6,
        marginBottom: 20,
    },
    preview: {
        width: 100,
        height: 150,
        borderRadius: 10,
    },
    loadingBox: {
        alignItems: 'center',
        marginTop: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#444',
    },
    detailsBox: {
        marginTop: 20,
        backgroundColor: '#FFF3F3',
        padding: 15,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8B0000',
        marginBottom: 6,
    },
    subText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    resultImage: {
        width: '100%',
        height: 200,
        marginTop: 10,
        borderRadius: 10,
    },
    error: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    }, suggestionContainer: {
        marginTop: 20,
        paddingHorizontal: 16,
        width: '100%',
        flex: 1,
    },

    didYouMeanText: {
        fontSize: 15,
        color: '#555',
        fontStyle: 'italic',
        marginRight: 5
    },

    highlightedName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#8B0000',
        marginBottom: 10,
    },

    listWrapper: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 16,
        marginTop: 10,
    },

    scrollInner: {
        paddingBottom: 20,
    },

    scrollContainer: {
        flex: 1,
    },

    cardsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    card: {
        width: 170,
        backgroundColor: '#fff',
        marginBottom: 12,
        borderRadius: 10,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
    },

    cardImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 6,
        objectFit: 'contain'
    },

    cardTitle: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    noResultBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        paddingHorizontal: 20,
    },

    noResultText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        fontStyle: 'italic',
    }
});