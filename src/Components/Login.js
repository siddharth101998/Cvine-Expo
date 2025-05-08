import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { loginUser, registerUser } from '../../authservice';
//import logo from '../assets/logo.png'; // Ensure the file exists
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../authContext/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { host } from '../API-info/apiifno';
const LoginScreen = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const { login } = useAuth();
    const navigation = useNavigation();

    const handleSubmit = async () => {
        try {
            if (!email || !password) {
                Alert.alert("Error", "Email and password are required.");
                return;
            }
            if (isRegister) {
                await registerUser(email, password, firstName);
                Alert.alert("Registered successfully!");
                setFirstName("");
                setEmail("");
                setPassword("")
                setIsRegister(false)
            } else {
                console.log("started")
                const res = await loginUser(email, password);
                //fetchUserRecommendations(res._id)
                login(res);

                navigation.navigate("Home"); // Make sure Home screen exists in your navigator
            }
        } catch (err) {
            Alert.alert("Error", err.message || "Something went wrong");
        }
    };
    const handlelogin = () => {
        setFirstName("");
        setEmail("");
        setPassword("")
        setIsRegister(!isRegister)
    }
    const fetchUserRecommendations = async (userId) => {
        try {
            // Fetch search history
            const searchRes = await axios.get(`${host}/searchHistory/${userId}`);
            const searchHistory = searchRes.data || [];

            // Fetch wishlist
            const wishlistRes = await axios.get(`${host}/wishlist/${userId}`);
            const wishlist = wishlistRes.data.bottles || [];

            // Extract last 3 searched bottle names
            const recentSearches = searchHistory
                .slice(-3)
                .map(entry => entry.bottle?.name)
                .filter(Boolean);

            // Randomly select up to 7 bottles from wishlist
            const shuffledWishlist = wishlist.sort(() => 0.5 - Math.random());
            const wishlistSelections = shuffledWishlist
                .map(bottle => bottle.name)
                .filter(Boolean)
                .slice(0, 7);

            // Combine and fill with sample bottles if needed
            let selectedBottles = [...recentSearches, ...wishlistSelections];
            const SAMPLE_BOTTLES = [
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
            const needed = 10 - selectedBottles.length;
            if (needed > 0) {
                const fallback = SAMPLE_BOTTLES.filter(name => !selectedBottles.includes(name));
                selectedBottles = [...selectedBottles, ...fallback.slice(0, needed)];
            }

            // Fetch recommendations
            const recRes = await axios.post(`${host}/api/recommend`, { selectedBottles });
            const recommendations = recRes.data.recommendations || [];

            // Store recommendations
            await AsyncStorage.setItem('wineRecommendations', JSON.stringify(recommendations));
        } catch (error) {
            console.error('Error fetching personalized recommendations:', error);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <Image style={styles.logo} />
            <Text style={styles.title}>{isRegister ? 'Sign Up' : 'Welcome Back!'}</Text>
            <Text style={styles.subtitle}>
                {isRegister ? 'Create an account to get started!' : 'Log in to continue'}
            </Text>

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

            <TouchableOpacity onPress={handlelogin}>
                <Text style={styles.switchText}>
                    {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                </Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F4F4',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },
    logo: {
        width: 200,
        height: 180,
        marginBottom: 30,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 25,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#2E8B57',
        paddingVertical: 14,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginTop: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    switchText: {
        color: '#B22222',
        marginTop: 20,
        fontWeight: 'bold',
    },
});