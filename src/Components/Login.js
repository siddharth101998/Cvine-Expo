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
const LoginScreen = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const { login } = useAuth();
    const navigation = useNavigation();

    const handleSubmit = async () => {
        try {
            if (!email || !password) {
                Alert.alert("Error", "Email and password are required.");
                return;
            }
            if (isRegister) {
                await registerUser(email, password, username, fullName);
                Alert.alert("Registered successfully!");
                setUsername('');
                setFullName('');
                setEmail('');
                setPassword('');
                setIsRegister(false);
            } else {
                console.log("started")
                const res = await loginUser(email, password);

                login(res);
                navigation.navigate("Home"); // Make sure Home screen exists in your navigator
            }
        } catch (err) {
            Alert.alert("Error", err.message || "Something went wrong");
        }
    };
    const handlelogin = () => {
        setUsername('');
        setFullName('');
        setEmail('');
        setPassword('');
        setIsRegister(!isRegister)
    }

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
                <>
                <TextInput
                    placeholder="Username"
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />
                <TextInput
                    placeholder="Full Name"
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                />
                </>
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