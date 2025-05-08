import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import logo from '../../assets/logo.png';
import { loginUser, registerUser } from '../../authservice';
import { useAuth } from '../authContext/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { host } from '../API-info/apiifno';
import { useNavigation } from '@react-navigation/native';
const LoginPrompt = ({ visible, onClose }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const navigation = useNavigation();
    const handleSubmit = async () => {
        try {
            if (!email || !password) return;

            if (isRegister) {
                await registerUser(email, password, firstName);
                setFirstName('');
                setIsRegister(false);
            } else {
                const res = await loginUser(email, password);
                // await fetchUserRecommendations(res._id);
                login(res);
                onClose(); // Close modal after successful login
                navigation.navigate("Home");
            }
        } catch (err) {
            console.error(err.message);
        }
    };

    const fetchUserRecommendations = async (userId) => {
        try {
            const searchRes = await axios.get(`${host}/searchHistory/${userId}`);
            const searchHistory = searchRes.data || [];

            const wishlistRes = await axios.get(`${host}/wishlist/${userId}`);
            const wishlist = wishlistRes.data.bottles || [];

            const recentSearches = searchHistory
                .slice(-3)
                .map(entry => entry.bottle?.name)
                .filter(Boolean);

            const wishlistSelections = wishlist
                .sort(() => 0.5 - Math.random())
                .map(b => b.name)
                .filter(Boolean)
                .slice(0, 7);

            let selectedBottles = [...recentSearches, ...wishlistSelections];
            const SAMPLE_BOTTLES = [
                "Château Lafite Rothschild 2015", "Opus One 2016",
                "Dominus Estate 2014", "Screaming Eagle Cabernet Sauvignon 2012",
                "Caymus Special Selection 2015", "Silver Oak Cabernet Sauvignon 2017",
                "Cakebread Cellars Chardonnay 2018", "Rombauer Chardonnay 2019",
                "Domaine Leflaive Puligny-Montrachet 2017", "Kistler Vineyards Chardonnay 2018"
            ];
            const fallback = SAMPLE_BOTTLES.filter(b => !selectedBottles.includes(b)).slice(0, 10 - selectedBottles.length);
            selectedBottles = [...selectedBottles, ...fallback];

            const recRes = await axios.post(`${host}/api/recommend`, { selectedBottles });
            const recommendations = recRes.data.recommendations || [];
            await AsyncStorage.setItem('wineRecommendations', JSON.stringify(recommendations));
        } catch (error) {
            console.error('Recommendation fetch error:', error);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalWrapper}
            >
                <View style={styles.modalContainer}>
                    <Image source={logo} style={styles.logo} />
                    <Text style={styles.title}>{isRegister ? 'Register' : 'Login to access this Service'}</Text>

                    {isRegister && (
                        <TextInput
                            placeholder="First Name"
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                    )}
                    <TextInput
                        placeholder="Email"
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        placeholder="Password"
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                        <Text style={styles.buttonText}>{isRegister ? 'Register' : 'Login'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
                        <Text style={styles.switchText}>
                            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default LoginPrompt;

const styles = StyleSheet.create({
    modalWrapper: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        margin: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 80,
        resizeMode: 'contain',
        marginBottom: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        width: '100%',
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#2E8B57',
        paddingVertical: 12,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
    switchText: {
        color: '#B22222',
        fontWeight: 'bold',
    },
    closeText: {
        marginTop: 10,
        color: '#555',
    },
});