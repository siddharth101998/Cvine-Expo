import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

const Navbar = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const tabs = [
        { name: 'Home', icon: 'home-outline', route: 'Home' },
        { name: 'Recommendation', icon: 'flame-outline', route: 'Recommendation' },
        { name: 'Scan', icon: 'camera', route: null }, // placeholder for scan button
        { name: 'Recipes', icon: 'book-outline', route: 'Recipes' },
        { name: 'Chat', icon: 'chatbubble-outline', route: 'Chat' },
    ];

    const handleTabPress = (tab) => {
        if (tab.name === 'Scan') {
            // custom scan handler logic (optional: call your handleScan function)
            console.log('Scan button pressed');
        } else if (tab.route) {
            navigation.navigate(tab.route);
        }
    };

    return (
        <View style={styles.container}>
            {/* Left Tabs */}<View style={styles.eachSidetab}>
                <View style={styles.leftsideTab}>
                    {tabs.slice(0, 2).map((tab, index) => (
                        <TouchableOpacity key={index} onPress={() => handleTabPress(tab)} style={styles.tabItem}>
                            <Ionicons
                                name={tab.icon}
                                size={24}
                                color={route.name === tab.route ? '#B22222' : 'gray'}
                            />
                            <Text style={styles.label}>{tab.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Right Tabs */}
                <View style={styles.rightsideTab}>
                    {tabs.slice(3).map((tab, index) => (
                        <TouchableOpacity key={index} onPress={() => handleTabPress(tab)} style={styles.tabItem}>
                            <Ionicons
                                name={tab.icon}
                                size={24}
                                color={route.name === tab.route ? '#B22222' : 'gray'}
                            />
                            <Text style={styles.label}>{tab.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

            </View>

            {/* Floating Center Scan Button */}
            <View style={styles.scanButtonWrapper}>
                <TouchableOpacity style={styles.scanButton} onPress={() => handleTabPress({ name: 'Scan' })}>
                    <Ionicons name="camera" size={26} color="#fff" />
                </TouchableOpacity>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 85,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    leftsideTab: {
        marginLeft: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 40
    },
    rightsideTab: {
        marginLeft: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 50
    },
    tabItem: {
        alignItems: 'center',
        gap: 2,
    },
    label: {
        fontSize: 10,
        color: '#555',
    },
    scanButtonWrapper: {
        position: 'absolute',
        alignItems: 'center',
        top: -30,
        left: '56%',
        transform: [{ translateX: -30 }],
    },
    scanButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2E8B57',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    eachSidetab: {
        display: "flex",
        flexDirection: 'row',
        gap: 53,
        padding: 5
    }
});

export default Navbar;