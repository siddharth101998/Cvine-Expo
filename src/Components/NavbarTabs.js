// src/Components/NavbarTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './HomeScreen';
import ScanScreen from './Scan';
// import ProfileScreen from './Profile'; // create if not exists
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const NavbarTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Recipes') iconName = focused ? 'book' : 'book-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#B22222',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Recipes" component={ScanScreen} />
            {/* <Tab.Screen name="Profile" component={ProfileScreen} /> */}
        </Tab.Navigator>
    );
};

export default NavbarTabs;