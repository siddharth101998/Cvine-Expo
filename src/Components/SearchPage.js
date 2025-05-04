import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Platform,
    Image // <-- Add this
} from 'react-native';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { host } from '../API-info/apiifno';
import { useAuth } from '../authContext/AuthContext';
const SearchPage = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const fetchBottles = async (query) => {
        if (!query) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`${host}/bottle/search`, {
                params: {
                    q: query,
                    // country: selectedCountry,
                    // winetype: selectedWineType,
                    // grapetype: selectedGrapeType,
                },
            });
            setSearchResults(response.data.data);
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
        setLoading(false);
    };


    const debouncedSearch = debounce((query) => {
        fetchBottles(query);
    }, 300);

    const handleSearch = (text) => {
        setSearchText(text);
        debouncedSearch(text);
    };
    const navigation = useNavigation();
    const handleBottleClick = (bottleId) => {
        navigation.navigate("Bottle", { id: bottleId });
        console.log("Bottle selected:", bottleId);
    };
    return (<ScrollView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Search Wines</Text>
        </View>

        <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="gray" style={{ marginRight: 8 }} />
            <TextInput
                placeholder="Search for a wine..."
                value={searchText}
                onChangeText={handleSearch}
                style={styles.input}
            />
        </View>

        {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}

        {searchResults.slice(0, 3).map((item) => (
            <TouchableOpacity key={item._id} style={styles.resultBox} onPress={() => handleBottleClick(item._id)}>
                <View style={styles.resultRow}>
                    <Image source={{ uri: item.imageUrl }} style={styles.bottleImage} />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.resultTitle}>{item.name}</Text>
                        <Text style={styles.resultSubtitle}>{item.winery}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        ))}
    </ScrollView>)
}
export default SearchPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        padding: 16,
        top: 60
    },
    searchBox: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    resultBox: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultSubtitle: {
        fontSize: 14,
        color: 'gray',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bottleImage: {
        width: 50,
        height: 50,
        borderRadius: 6,
        backgroundColor: '#eee',
        objectFit: 'contain'
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultSubtitle: {
        fontSize: 14,
        color: 'gray',
    },
})