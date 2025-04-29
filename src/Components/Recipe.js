import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../authContext/AuthContext';
import debounce from 'lodash.debounce';
const API_BASE_URL = 'http://localhost:5002'; // Update for production

const RecipePage = () => {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddRecipe, setShowAddRecipe] = useState(false);
    const [newRecipe, setNewRecipe] = useState({
        name: '',
        items: [],
        method: '',
        bottles: [], // array of { id, name, image }
    });
    const [currentItem, setCurrentItem] = useState({ itemName: '', quantity: '' });
    const [availableBottles, setAvailableBottles] = useState([]);
    const [selectedBottle, setSelectedBottle] = useState(null);
    const [bottleSearchText, setBottleSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    useEffect(() => {
        fetchRecipes();
        fetchBottles();
    }, []);

    const fetchRecipes = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/recipe/`);
            console.log("recipes", response.data)
            setRecipes(response.data);
        } catch (error) {
            console.error('Error fetching recipes:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBottles = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/bottle/`);
            setAvailableBottles(response.data);
        } catch (error) {
            console.error('Error fetching bottles:', error);
        }
    };
    const handleSearchbottle = (text) => {
        setBottleSearchText(text);
        debouncedSearch(text);
    };

    const handleAddItem = () => {
        if (currentItem.itemName && currentItem.quantity) {
            setNewRecipe((prev) => ({
                ...prev,
                items: [...prev.items, currentItem],
            }));
            setCurrentItem({ itemName: '', quantity: '' });
        }
    };

    const handleSubmitRecipe = async () => {
        try {
            const payload = {
                name: newRecipe.name,
                ingredients: newRecipe.items,
                bottles: newRecipe.bottles,
                method: newRecipe.method,
                userName: user?.username,
                byUserId: user?._id,
            };
            const response = await axios.post(`${API_BASE_URL}/recipe/`, payload);
            setRecipes((prev) => [...prev, response.data]);
            setNewRecipe({ name: '', items: [], method: '', bottles: [] });
            setShowAddRecipe(false);
        } catch (error) {
            console.error('Error creating recipe:', error);
        }
    };

    const handleToggleLike = async (recipeId) => {
        try {
            const payload = { recipeId, userId: user?._id };
            const response = await axios.put(`${API_BASE_URL}/recipe/like`, payload);
            updateRecipeInList(response.data);
        } catch (error) {
            console.error('Error liking recipe:', error);
        }
    };

    const handleToggleDislike = async (recipeId) => {
        try {
            const payload = { recipeId, userId: user?._id };
            const response = await axios.put(`${API_BASE_URL}/recipe/dislike`, payload);
            updateRecipeInList(response.data);
        } catch (error) {
            console.error('Error disliking recipe:', error);
        }
    };

    const handleAddComment = async (recipeId) => {
        const comment = await new Promise((resolve) => {
            Alert.prompt('Add a Comment', 'Write your comment below:', [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
                { text: 'Submit', onPress: (input) => resolve(input) },
            ]);
        });
        if (!comment) return;

        try {
            const response = await axios.post(`${API_BASE_URL}/recipe/comment`, {
                comment,
                recipeId,
                userId: user?._id,
            });
            updateRecipeInList(response.data);
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const updateRecipeInList = (updatedRecipe) => {
        setRecipes((prev) =>
            prev.map((r) => (r._id === updatedRecipe._id ? updatedRecipe : r))
        );
    };
    const fetchsearchBottles = async (query) => {
        if (!query) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/bottle/search`, {
                params: {
                    q: query,

                },
            });
            setSearchResults(response.data.data);
            console.log("bottles", response.data)
        } catch (error) {
            console.error("Error fetching search results:", error);
        }

    };

    const filteredRecipes = recipes.filter((r) =>
        r.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const debouncedSearch = debounce((query) => {
        fetchsearchBottles(query);
    }, 300);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#b22222" />;

    // (text) => {
    //     console.log("tes", text)
    //     setBottleSearchText(text); // allow user to type freely
    //     if (Array.isArray(availableBottles)) {
    //         const match = availableBottles.find((bottle) =>
    //             bottle.name.toLowerCase().includes(text.toLowerCase())
    //         );
    //         if (match) setSelectedBottle(match);
    //         else setSelectedBottle(null);
    //     }
    // }
    return (
        <ScrollView style={styles.container}>
            <View style={styles.inner}>
                <Text style={styles.header}>Recipes</Text>

                {/* Search */}
                <TextInput
                    style={styles.input}
                    placeholder="Search Recipes..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />

                {/* Add Recipe Button */}
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddRecipe(!showAddRecipe)}>
                    <Text style={styles.addButtonText}>{showAddRecipe ? 'Cancel' : 'Add Recipe'}</Text>
                </TouchableOpacity>

                {/* Collapsible Add Recipe Form */}
                {showAddRecipe && (
                    <View style={styles.addRecipeForm}>
                        <TextInput
                            style={styles.input}
                            placeholder="Recipe Name"
                            value={newRecipe.name}
                            onChangeText={(text) => setNewRecipe({ ...newRecipe, name: text })}
                        />
                        <View style={styles.row}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Item Name"
                                value={currentItem.itemName}
                                onChangeText={(text) => setCurrentItem({ ...currentItem, itemName: text })}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Quantity"
                                value={currentItem.quantity}
                                onChangeText={(text) => setCurrentItem({ ...currentItem, quantity: text })}
                            />
                            <TouchableOpacity style={styles.smallButton} onPress={handleAddItem}>
                                <Ionicons name="add-circle" size={28} color="#2E8B57" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subHeader}>Items:</Text>
                        {newRecipe.items.map((item, idx) => (
                            <Text key={idx} style={styles.itemText}>
                                - {item.itemName}: {item.quantity}
                            </Text>
                        ))}

                        <Text style={styles.subHeader}>Select Bottle:</Text>
                        <View style={styles.row}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Search Bottles..."
                                value={bottleSearchText}
                                onChangeText={handleSearchbottle}
                            />

                            {/* <TouchableOpacity style={styles.smallButton} onPress={() => {
                                if (selectedBottle) {
                                    setNewRecipe((prev) => ({
                                        ...prev,
                                        bottles: [
                                            ...prev.bottles,
                                            {
                                                id: selectedBottle._id,
                                                name: selectedBottle.name,
                                                image: selectedBottle.image,
                                            },
                                        ],
                                    }));
                                    setSelectedBottle(null);
                                    setBottleSearchText(''); // reset search field
                                }
                            }}>
                                <Ionicons name="add-circle" size={28} color="#B22222" />
                            </TouchableOpacity> */}
                        </View>
                        <View style={styles.row}>
                            {searchResults.length > 0 && (
                                <View style={styles.dropdown}>
                                    <ScrollView style={{ maxHeight: 150 }}>
                                        {searchResults.map((bottle) => (
                                            <TouchableOpacity
                                                key={bottle._id}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setNewRecipe((prev) => ({
                                                        ...prev,
                                                        bottles: [
                                                            ...prev.bottles,
                                                            { id: bottle._id, name: bottle.name, image: bottle.image },
                                                        ],
                                                    }));
                                                    setBottleSearchText('');
                                                    setSearchResults([]);
                                                }}
                                            >
                                                <Text>{bottle.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                        <Text style={styles.subHeader}>Selected Bottles:</Text>
                        {newRecipe.bottles.map((bottle, idx) => (
                            <Text key={idx} style={styles.itemText}>
                                - {bottle.name}
                            </Text>
                        ))}

                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            placeholder="Method"
                            multiline
                            value={newRecipe.method}
                            onChangeText={(text) => setNewRecipe({ ...newRecipe, method: text })}
                        />

                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRecipe}>
                            <Text style={styles.submitButtonText}>Submit Recipe</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Recipe Cards */}
                {filteredRecipes.map((recipe) => {
                    const isLiked = recipe.likedusers?.includes(user?._id);
                    const isDisliked = recipe.dislikedusers?.includes(user?._id);
                    return (
                        <View key={recipe._id} style={styles.card}>
                            <Text style={styles.recipeName}>{recipe.name}</Text>
                            <Text style={styles.subHeader}>Items:</Text>
                            {recipe.ingredients?.map((item, idx) => (
                                <Text key={idx} style={styles.itemText}>
                                    - {item.itemName}: {item.quantity}
                                </Text>
                            ))}
                            <Text style={styles.subHeader}>Method:</Text>
                            <Text style={styles.itemText}>{recipe.method}</Text>

                            {/* Actions */}
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => handleToggleLike(recipe._id)}>
                                    <Ionicons
                                        name="thumbs-up"
                                        size={24}
                                        color={isLiked ? '#2E8B57' : '#999'}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleToggleDislike(recipe._id)}>
                                    <Ionicons
                                        name="thumbs-down"
                                        size={24}
                                        color={isDisliked ? '#B22222' : '#999'}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleAddComment(recipe._id)}>
                                    <Ionicons name="chatbubble-ellipses" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
};

export default RecipePage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fcf8f5',
    },
    inner: {
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: '600',
        color: '#3e3e3e',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    addButton: {
        backgroundColor: '#2E8B57',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    addRecipeForm: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 3,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',

    },
    smallButton: {
        marginLeft: 8,
    },
    subHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 2,
        marginBottom: 2,
        color: '#333',
    },
    itemText: {
        fontSize: 14,
        color: '#555',
    },
    submitButton: {
        backgroundColor: '#B22222',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
        elevation: 2,
    },
    recipeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E2E2E',
        marginBottom: 8,
    },
    actions: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 12,
        justifyContent: 'flex-start',
    },
});