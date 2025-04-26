import { auth } from './firebase'; // make sure path is correct
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import axios from 'axios';
import { useAuth } from './src/authContext/AuthContext';
// 🔧 Replace this with your actual IP if you're calling a local backend
const API_BASE_URL = "http://localhost:5002";
// const API_BASE_URL = 'https://a19b-2601-86-0-1580-e45b-5c-b3e1-ec58.ngrok-free.app';

// 🔐 Register User
export const registerUser = async (email, password, firstName) => {
    try {
        console.log("register started", password);

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;

        console.log("firebase register finished");

        // 🌐 Call backend to save to MongoDB
        const res = await axios.post(`${API_BASE_URL}/user/`, {
            email,
            password,
            firstName,
        });

        return res.data.data;
    } catch (error) {
        throw error;
    }
};

// 🔓 Login User
export const loginUser = async (email, password) => {
    try {

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;

        // Optionally also hit your backend
        const res = await axios.post(`${API_BASE_URL}/user/login`, {
            email,
            password,
        });

        return res.data.user;
    } catch (error) {
        throw error;
    }
};

// 🚪 Logout User
export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        throw error;
    }
};