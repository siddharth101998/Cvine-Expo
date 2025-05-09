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
    const [countries, setCountries] = useState([]);
    const [wineTypes, setWineTypes] = useState([]);
    const [grapeTypes, setGrapeTypes] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedWineType, setSelectedWineType] = useState('');
    const [selectedGrapeType, setSelectedGrapeType] = useState('');
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [selectedWineTypes, setSelectedWineTypes] = useState([]);
    const [selectedGrapeTypes, setSelectedGrapeTypes] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    const toggleSelection = (item, selectedItems, setSelectedItems) => {

        if (selectedItems.includes(item)) {

            const updated = selectedItems.filter(i => i !== item);
            setSelectedItems(updated);

        } else {
            setSelectedItems([...selectedItems, item]);

        }

    };
    useEffect(() => {
        fetchCountries();
        fetchWineTypes();
        fetchGrapeTypes();

    }, []);
    useEffect(() => {
        debouncedSearch(searchText);
    }, [selectedWineTypes, selectedCountries, selectedGrapeTypes])

    const fetchBottles = async (query) => {

        console.log('winetypes', selectedWineTypes);

        setLoading(true);
        try {
            console.log(selectedWineTypes)
            const response = await axios.get(`${host}/bottle/search`, {
                params: {
                    q: query,
                    country: selectedCountries,
                    wineType: selectedWineTypes,
                    grapeType: selectedGrapeTypes,
                },
            });

            setSearchResults(response.data.data);
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
        setLoading(false);
    };
    const fetchCountries = async () => {
        try {
            const response = await axios.get(`${host}/region`);
            setCountries(response.data);
        } catch (error) {
            console.error("Error fetching countries:", error);
        }
    };

    const fetchWineTypes = async () => {
        try {
            const response = await axios.get(`${host}/winetype`);
            setWineTypes(response.data);
        } catch (error) {
            console.error("Error fetching wine types:", error);
        }
    };

    const fetchGrapeTypes = async () => {
        try {
            const response = await axios.get(`${host}/grapetype`);
            setGrapeTypes(response.data);
        } catch (error) {
            console.error("Error fetching grape types:", error);
        }
    };



    const debouncedSearch = debounce((query) => {
        fetchBottles(query);
    }, 50);

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
        {/* <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterToggle}>
            <Ionicons name="filter" size={18} />
            <Text style={styles.filterText}>Toggle Filters</Text>
        </TouchableOpacity> */}

        {showFilters && (
            <View style={styles.filterContainer}>

                {/* Country Filter */}
                <View style={styles.filterHeader}>
                    <Text style={styles.filterLabel}>Country</Text>
                    {selectedCountries.length > 0 && (
                        <TouchableOpacity onPress={() => setSelectedCountries([])}>
                            <Text style={styles.clearButton}>Close Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        key="clear-countries"
                        style={[
                            styles.filterOption,
                            selectedCountries.length === 0 && styles.selectedOption
                        ]}
                        onPress={() => setSelectedCountries([])}
                    >
                        <Text>ALL</Text>
                    </TouchableOpacity>
                    {countries.map((country) => (
                        <TouchableOpacity
                            key={country.country}
                            style={[
                                styles.filterOption,
                                selectedCountries.includes(country.country) && styles.selectedOption
                            ]}
                            onPress={() => { toggleSelection(country.country, selectedCountries, setSelectedCountries); }}
                        >
                            <Text>{country.country}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Wine Type Filter */}
                <View style={styles.filterHeader}>
                    <Text style={styles.filterLabel}>Wine Type</Text>
                    {selectedWineTypes.length > 0 && (
                        <TouchableOpacity onPress={() => setSelectedWineTypes([])}>
                            <Text style={styles.clearButton}>Close Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        key="clear-winetypes"
                        style={[
                            styles.filterOption,
                            selectedWineTypes.length === 0 && styles.selectedOption
                        ]}
                        onPress={() => setSelectedWineTypes([])}
                    >
                        <Text>ALL</Text>
                    </TouchableOpacity>
                    {wineTypes.map((w) => (
                        <TouchableOpacity
                            key={w.name}
                            style={[
                                styles.filterOption,
                                selectedWineTypes.includes(w.name) && styles.selectedOption
                            ]}
                            onPress={() => {
                                toggleSelection(w.name, selectedWineTypes, setSelectedWineTypes);
                            }}
                        >
                            <Text>{w.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Grape Type Filter */}
                <View style={styles.filterHeader}>
                    <Text style={styles.filterLabel}>Grape Type</Text>
                    {selectedGrapeTypes.length > 0 && (
                        <TouchableOpacity onPress={() => setSelectedGrapeTypes([])}>
                            <Text style={styles.clearButton}>Close Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        key="clear-grapetypes"
                        style={[
                            styles.filterOption,
                            selectedGrapeTypes.length === 0 && styles.selectedOption
                        ]}
                        onPress={() => setSelectedGrapeTypes([])}
                    >
                        <Text>ALL</Text>
                    </TouchableOpacity>
                    {grapeTypes.map((g) => (
                        <TouchableOpacity
                            key={g.name}
                            style={[
                                styles.filterOption,
                                selectedGrapeTypes.includes(g.name) && styles.selectedOption
                            ]}
                            onPress={() => { toggleSelection(g.name, selectedGrapeTypes, setSelectedGrapeTypes); }}
                        >
                            <Text>{g.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

            </View>
        )}


        <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="gray" style={{ marginRight: 8 }} />
                <TextInput
                    placeholder="Search for a wine..."
                    value={searchText}
                    onChangeText={handleSearch}
                    style={styles.input}
                />
            </View>
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterIcon}>
                <Ionicons name="filter" size={22} color="gray" />
            </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}

        {searchResults.slice(0, 7).map((item) => (
            <TouchableOpacity key={item._id} style={styles.resultBox} onPress={() => handleBottleClick(item._id)}>
                <View style={styles.resultRow}>
                    <Image source={{ uri: item.imageUrl }} style={styles.bottleImage} />
                    <View style={{ marginLeft: 10, }}>
                        <Text style={styles.resultTitle}>
                            {item.name}
                        </Text>
                        <Text style={styles.resultSubtitle}>{item.Winery}</Text>
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
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        marginTop: 10,
    },

    clearButton: {
        fontSize: 12,
        color: '#007BFF',
        marginRight: 8,
    },

    searchBox: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 8,
        marginRight: 5,
    },

    resultBox: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
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
        width: "80%"
    },
    bottleImage: {
        width: 50,
        height: 50,
        borderRadius: 6,
        backgroundColor: '#eee',
        objectFit: 'contain'
    },

    resultSubtitle: {
        fontSize: 14,
        color: 'gray',
    }, resultBox: {
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
    filterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    filterText: {
        marginLeft: 6,
        fontWeight: 'bold',
    },
    filterContainer: {
        marginTop: 10,
    },
    filterLabel: {
        fontWeight: 'bold',
        marginBottom: 6,
    },
    filterOption: {
        backgroundColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 10,
    },
    selectedOption: {
        backgroundColor: '#b22222',
        color: '#fff',
    },
    filterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    filterText: {
        marginLeft: 6,
        fontWeight: 'bold',
    },
    filterContainer: {
        marginTop: 10,
    },
    filterLabel: {
        fontWeight: 'bold',
        marginBottom: 6,
    },
    filterOption: {
        backgroundColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 10,
    },
    selectedOption: {
        backgroundColor: '#b22222',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        marginBottom: 10,
    },



    input: {
        flex: 1,
        fontSize: 16,
    },

    filterIcon: {
        padding: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },

    applyButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },

    applyButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
})