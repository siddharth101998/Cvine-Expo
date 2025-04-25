import React, { useState } from 'react';
import { View, Button, Image, Alert, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase'; // your firebase setup
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

const API_BASE_URL = "http://localhost:5002";
// const API_BASE_URL = 'https://a19b-2601-86-0-1580-e45b-5c-b3e1-ec58.ngrok-free.app';
const ScanScreen = () => {
    const [imageUri, setImageUri] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [wineDetails, setWineDetails] = useState(null);

    const handleScan = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission required', 'Camera access is needed to scan labels.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImageUri(uri);
            uploadAndProcessImage(uri);
        }
    };

    const uploadAndProcessImage = async (uri) => {
        try {
            setProcessing(true);

            // Convert image URI to Blob using fetch
            const response = await fetch(uri);
            const blob = await response.blob();

            const fileName = `uploaded_images/${Date.now()}.jpg`;
            const storageRef = ref(storage, fileName);

            // Upload the Blob to Firebase Storage
            await uploadBytes(storageRef, blob);

            // Get the download URL
            const downloadUrl = await getDownloadURL(storageRef);
            console.log("Download URL:", downloadUrl);

            // Send the download URL to your backend for processing
            const res = await axios.post(`${API_BASE_URL}/process-image`, { imageUrl: downloadUrl });
            setWineDetails(res.data);

        } catch (err) {
            console.error('Upload error:', err);
            Alert.alert('Upload Failed', 'There was a problem uploading the image.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            <Button title="Scan" onPress={handleScan} />
            {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
            {processing && <ActivityIndicator size="large" color="crimson" />}
            {wineDetails && (
                <View style={styles.details}>
                    {wineDetails.message ? (
                        <Text style={styles.error}>{wineDetails.message}</Text>
                    ) : (
                        <>
                            <Text style={styles.title}>{wineDetails.name}</Text>
                            <Text>Winery: {wineDetails.Winery}</Text>
                            <Text>Region: {wineDetails.region}</Text>
                            <Image source={{ uri: wineDetails.imageUrl }} style={styles.resultImage} />
                        </>
                    )}
                </View>
            )}
        </View>
    );
};

export default ScanScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, alignItems: 'center' },
    preview: { width: 200, height: 300, marginVertical: 20, borderRadius: 10 },
    resultImage: { width: '100%', height: 200, marginTop: 10, borderRadius: 10 },
    details: { marginTop: 20, alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
    error: { color: 'red' }
});