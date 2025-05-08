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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../authContext/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { host } from '../API-info/apiifno';
import logo from '../../assets/logo.png'; // your logo path

const LoginScreen = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const { login } = useAuth();
    const navigation = useNavigation();
    const [islogin, setIslogin] = useState(false);

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
                setPassword("");
                setIsRegister(false);
            } else {
                const res = await loginUser(email, password);
                //fetchUserRecommendations(res._id);
                login(res);
                navigation.navigate("Home");
            }
        } catch (err) {
            Alert.alert("Error", err.message || "Something went wrong");
        }
    };

    const guestlogin = () => {
        navigation.navigate("Home");
    };

    const handlelogin = () => {
        setFirstName("");
        setEmail("");
        setPassword("");
        setIsRegister(!isRegister);
        setIslogin(!islogin);
    };
    const handleregister = () => {
        setEmail("");
        setPassword("");
        setIsRegister(!isRegister);
    }

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

            const shuffledWishlist = wishlist.sort(() => 0.5 - Math.random());
            const wishlistSelections = shuffledWishlist
                .map(bottle => bottle.name)
                .filter(Boolean)
                .slice(0, 7);

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

            const recRes = await axios.post(`${host}/api/recommend`, { selectedBottles });
            const recommendations = recRes.data.recommendations || [];
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
            <Image source={logo} style={styles.logo} />

            {!isRegister && !islogin && (
                <>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.skipButton} onPress={guestlogin}>
                            <Text style={styles.skipButtonText}>Skip Login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => setIslogin(true)}>
                            <Text style={styles.buttonText}>Login</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => { handleregister() }}>
                        <Text style={styles.switchText}>Don't have an account? Register</Text>
                    </TouchableOpacity>
                </>
            )}

            {islogin && (
                <>
                    <Text style={styles.title}>Login</Text>
                    <Text style={styles.subtitle}>Login and Enhance your wine Discovery</Text>


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
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlelogin}>
                        <Text style={styles.switchText}>ADon't have an account? Register</Text>
                    </TouchableOpacity>
                </>
            )

            }

            {isRegister && (
                <>
                    <Text style={styles.title}>Sign Up</Text>
                    <Text style={styles.subtitle}>Create an account to get started!</Text>

                    <TextInput
                        placeholder="First Name"
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                    />
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
                        <Text style={styles.buttonText}>Register</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlelogin}>
                        <Text style={styles.switchText}>Already have an account? Login</Text>
                    </TouchableOpacity>
                </>
            )}
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
        width: '100%',
    },
    logo: {
        width: 180,
        height: 120,
        resizeMode: 'contain',
        marginBottom: 30,
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
        width: '48%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 15,
    },
    skipButton: {
        backgroundColor: '#D3D3D3',
        paddingVertical: 14,
        borderRadius: 8,
        width: '48%',
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    switchText: {
        color: '#B22222',
        marginTop: 15,
        fontWeight: 'bold',
    },
});