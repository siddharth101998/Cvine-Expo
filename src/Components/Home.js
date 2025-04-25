import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
//import { logoutUser } from '../authService'; // optional

const HomeScreen = () => {
    const navigation = useNavigation();

    const handleLogout = async () => {
        try {
            // await logoutUser();
            navigation.replace('Login'); // go back to login screen
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.text}>🎉 You are logged in!</Text>
            <Button title="Log Out" onPress={handleLogout} />
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4F8',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    text: {
        fontSize: 20,
        marginBottom: 20,
    },
});