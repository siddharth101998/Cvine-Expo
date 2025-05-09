// src/authservice.js

// ↓↓ Comment out Firebase imports
// import { auth } from './firebase'; // make sure path is correct
// import {
//     createUserWithEmailAndPassword,
//     signInWithEmailAndPassword,
//     signOut,
// } from 'firebase/auth';
import axios from 'axios';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { signOut } from 'firebase/auth';

// 🔧 Replace this with your actual IP if you're calling a local backend

//const host = "http://localhost:5002"
const host = "https://cvine.onrender.com"
// 🔐 Register User
export const registerUser = async (email, password, username, fullName) => {
    try {
        console.log("register started", { email, username, fullName });

        // ↓↓ Skip Firebase user creation
        // const userCredential = await createUserWithEmailAndPassword(
        //     auth,
        //     email,
        //     password
        // );
        // const user = userCredential.user;
        // console.log("firebase register finished");

        // 🌐 Call backend to save to MongoDB
        const res = await axios.post(`${host}/user/`, {
            email,
            password,
            username,
            fullName,
        });
        if (res.ok) { Alert.alert('Success', 'Account created successfully!'); }

        return res.data.data;
    } catch (error) {
        // AxiosError for 400, 500, etc:
        if (error.response && error.response.data && error.response.data.message) {
            Alert.alert('Error', error.response.data.message);
        } else {
            Alert.alert('Error', error.message || 'Something went wrong');
        }
    }
};


export const loginUser = async (email, password) => {
    try {

        console.log(`${host}/user/login`, email);



        const res = await axios.post(`${host}/user/login`, {
            email,
            password,
        });
        console.log("login res", res.data);
        return res.data.user;
    } catch (error) {
        throw error;
    }
};

// 🚪 Logout User
export const logoutUser = async () => {
    try {
        // ↓↓ Skip Firebase sign-out
        await signOut();
        //If you need to notify backend, you could:
        // await axios.post(`${host}/user/logout`);
    } catch (error) {
        throw error;
    }
};