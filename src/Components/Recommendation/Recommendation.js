import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Dimensions,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../authContext/AuthContext'
// import { TabView, TabBar } from 'react-native-tab-view';
import debounce from 'lodash.debounce';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import Personalized from './Personalised';
import GetRecommendation from './GetRecommendation';
import { host } from '../../API-info/apiifno';
//const API_BASE_URL = 'http://localhost:5002'; // Update for production
const MemoizedTextInput = React.memo(({ value, onChangeText, ...props }) => (
    <TextInput
        value={value}
        onChangeText={onChangeText}
        {...props}
    />
));
const RecommendationMain = ({ }) => {
    // const layout = Dimensions.get('window');
    const { user } = useAuth();
    const userId = user?._id;

    const [index, setIndex] = useState(0);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>AI Recommendations</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                <TouchableOpacity onPress={() => setIndex(0)} style={[styles.tabButton, index === 0 && styles.activeTab]}>
                    <Text style={[styles.tabText, index === 0 && { color: '#fff' }]}>Personalized</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIndex(1)} style={[styles.tabButton, index === 1 && styles.activeTab]}>
                    <Text style={[styles.tabText, index === 1 && { color: '#fff' }]}>Get Recommendations</Text>
                </TouchableOpacity>
            </View>
            {index === 0 ? (
                <Personalized />
            ) : (
                <GetRecommendation />
            )}
        </View>
    );
};

export default RecommendationMain;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fcf8f5',

    },

    // header: {
    //     fontSize: 24,
    //     fontWeight: '600',
    //     color: '#3e3e3e',
    //     paddingTop: 50,
    //     paddingBottom: 20,
    //     textAlign: 'center',
    //     backgroundColor: '#B22222',
    // },


    // headerText: {
    //     color: '#fff',
    //     fontSize: 24,
    //     fontWeight: 'bold',
    // },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#B22222',
        alignItems: 'center',
    },
    headerText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },

    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#eee',
        // borderTopLeftRadius: 8,
        // borderTopRightRadius: 8,
        marginHorizontal: 2,
        borderRadius: 8,
        marginTop: 2
    },
    activeTab: {
        backgroundColor: '#B22222',

        borderBottomColor: '#fff8f5',
    },
    tabText: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#B22222',
    },
});