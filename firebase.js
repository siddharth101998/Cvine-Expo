import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import Constants from 'expo-constants';

const {
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID,
} = Constants.expoConfig.extra;

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

export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;