import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCktkNvbxBN62c6hqD6iVWJ3xnkViJJixo",
    authDomain: "cvine-fullstack.firebaseapp.com",
    projectId: "cvine-fullstack",
    storageBucket: "cvine-fullstack.firebasestorage.app",
    messagingSenderId: "405950595027",
    appId: "1:405950595027:web:83371e90c426be3ef57926",
    measurementId: "G-K89K34L6P1",
};

const app = initializeApp(firebaseConfig);

// ✅ Properly initialize auth for React Native with AsyncStorage


const storage = getStorage(app);

export { app, storage };