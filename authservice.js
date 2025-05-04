// src/authservice.js

// ↓↓ Comment out Firebase imports
// import { auth } from './firebase'; // make sure path is correct
// import {
//     createUserWithEmailAndPassword,
//     signInWithEmailAndPassword,
//     signOut,
// } from 'firebase/auth';
import axios from 'axios';

// 🔧 Replace this with your actual IP if you're calling a local backend
const API_BASE_URL = "http://localhost:5002";
// const API_BASE_URL = 'https://your-ngrok-url.ngrok-free.app';

// 🔐 Register User
export const registerUser = async (email, password, firstName) => {
    try {
        console.log("register started", password);

        // ↓↓ Skip Firebase user creation
        // const userCredential = await createUserWithEmailAndPassword(
        //     auth,
        //     email,
        //     password
        // );
        // const user = userCredential.user;
        // console.log("firebase register finished");

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
        // ↓↓ Skip Firebase sign-in
        // const userCredential = await signInWithEmailAndPassword(
        //     auth,
        //     email,
        //     password
        // );
        // const user = userCredential.user;

        // Hit your backend for auth
        const res = await axios.post(`${API_BASE_URL}/user/login`, {
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
        // await signOut(auth);
        // If you need to notify backend, you could:
        // await axios.post(`${API_BASE_URL}/user/logout`);
    } catch (error) {
        throw error;
    }
};