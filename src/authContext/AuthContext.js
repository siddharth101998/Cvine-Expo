// src/context/AuthContext.js

import React, { createContext, useContext, useState } from 'react';

// Create AuthContext
const AuthContext = createContext();

// AuthProvider
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (userData) => {
        console.log('Logging in user:', userData);
        setUser(userData);
    };

    const logout = () => {
        console.log('Logging out user');
        setUser(null);
    };

    const updateUser = (updatedFields) => {
        console.log('Updating user fields:', updatedFields);
        setUser((prevUser) => ({
            ...prevUser,
            ...updatedFields,
        }));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};