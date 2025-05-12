// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
    initializeAuth,
    getReactNativePersistence
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
    apiKey: "AIzaSyCktkNvbxBN62c6hqD6iVWJ3xnkViJJixo",
    authDomain: "cvine-fullstack.firebaseapp.com",
    projectId: "cvine-fullstack",
    storageBucket: "cvine-fullstack.firebasestorage.app",
    messagingSenderId: "405950595027",
    appId: "1:405950595027:web:83371e90c426be3ef57926",
    measurementId: "G-K89K34L6P1"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

// 2) Initialize Auth with React Native persistence
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// 3) Initialize Storage (no change)
export const storage = getStorage(app);