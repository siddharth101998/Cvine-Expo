import { useEffect, useState } from "react";
import { FlatList, Dimensions, Text, TouchableOpacity, StyleSheet, View, Modal, TextInput, Button, ScrollView } from "react-native";
import { useAuth } from "../authContext/AuthContext";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const API_BASE_URL = 'http://localhost:5002';

export default function UserRecipes( ) {
    const [userRecipes, setUserRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { user } = useAuth();
     const navigation = useNavigation();

    useEffect(() => {
        const fetchUserRecipes = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/recipe/user/${user._id}`);
                setUserRecipes(response.data);
            } catch (error) {
                console.error("Error fetching user recipes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserRecipes();
    }, [user._id]);

    const handleEditRecipe = async () => {
        try {
            await axios.put(`${API_BASE_URL}/recipe/${selectedRecipe._id}`, selectedRecipe);
            const updatedRecipes = userRecipes.map(recipe =>
                recipe._id === selectedRecipe._id ? selectedRecipe : recipe
            );
            setUserRecipes(updatedRecipes);
            setIsModalVisible(false);
        } catch (error) {
            console.error("Error updating recipe:", error);
        }
    };

    const handleDeleteRecipe = async (recipeId) => {
        try {
            await axios.delete(`${API_BASE_URL}/recipe/${recipeId}`);
            const updatedRecipes = userRecipes.filter(recipe => recipe._id !== recipeId);
            setUserRecipes(updatedRecipes);
        } catch (error) {
            console.error("Error deleting recipe:", error);
        }
    };

    if (loading) {
        return <Text>Loading...</Text>;
    }
    if (userRecipes.length === 0) {
        return <Text>No recipes found.</Text>;
    }

    return (
        <View style={styles.container}> 
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Profile')}>
                <Ionicons name="arrow-back" size={24} color="black" />
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <FlatList
                data={userRecipes}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.recipeName}>{item.name}</Text>
                        <Text style={styles.recipeDescription}>Ingredients:</Text>
                        {item.ingredients.map((ingredient, index) => (
                            <Text key={index} style={styles.ingredientText}>
                                {ingredient.itemName} - {ingredient.quantity}
                            </Text>
                        ))}
                        <Text style={styles.recipeDescription}>Method:</Text>
                        <Text style={styles.methodText}>{item.method}</Text>
                        <View style={styles.cardButtons}>
                            <Button
                                title="Edit"
                                onPress={() => {
                                    setSelectedRecipe(item);
                                    setIsModalVisible(true);
                                }}
                            />
                            <Button
                                title="Delete"
                                onPress={() => handleDeleteRecipe(item._id)}
                                color="red"
                            />
                        </View>
                    </View>
                )}
            />
            {selectedRecipe && (
                <Modal
                    visible={isModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsModalVisible(false)}
                >
                    <ScrollView contentContainerStyle={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Recipe</Text>
                            <TextInput
                                style={styles.input}
                                value={selectedRecipe.name}
                                onChangeText={(text) => setSelectedRecipe({ ...selectedRecipe, name: text })}
                                placeholder="Recipe Name"
                            />
                            <Text style={styles.modalSubtitle}>Ingredients:</Text>
                            {selectedRecipe.ingredients.map((ingredient, index) => (
                                <View key={index} style={styles.ingredientRow}>
                                    <TextInput
                                        style={[styles.input, styles.ingredientInput]}
                                        value={ingredient.itemName}
                                        onChangeText={(text) => {
                                            const updatedIngredients = [...selectedRecipe.ingredients];
                                            updatedIngredients[index].itemName = text;
                                            setSelectedRecipe({ ...selectedRecipe, ingredients: updatedIngredients });
                                        }}
                                        placeholder="Ingredient Name"
                                    />
                                    <TextInput
                                        style={[styles.input, styles.quantityInput]}
                                        value={ingredient.quantity}
                                        onChangeText={(text) => {
                                            const updatedIngredients = [...selectedRecipe.ingredients];
                                            updatedIngredients[index].quantity = text;
                                            setSelectedRecipe({ ...selectedRecipe, ingredients: updatedIngredients });
                                        }}
                                        placeholder="Quantity"
                                    />
                                </View>
                            ))}
                            <Text style={styles.modalSubtitle}>Method:</Text>
                            <TextInput
                                style={[styles.input, styles.methodInput]}
                                value={selectedRecipe.method}
                                onChangeText={(text) => setSelectedRecipe({ ...selectedRecipe, method: text })}
                                placeholder="Method"
                                multiline
                            />
                            <View style={styles.modalButtons}>
                                <Button title="Save" onPress={handleEditRecipe} />
                                <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
                            </View>
                        </View>
                    </ScrollView>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
        paddingHorizontal: 10,
        paddingTop: 10,
        top: 65,
    },
    card: {
        width: SCREEN_WIDTH - 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        elevation: 3,
    },
    recipeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    recipeDescription: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#555',
    },
    ingredientText: {
        fontSize: 14,
        color: '#666',
    },
    methodText: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    cardButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalContent: {
        width: SCREEN_WIDTH - 40,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalSubtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    ingredientRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    ingredientInput: {
        flex: 2,
        marginRight: 5,
    },
    quantityInput: {
        flex: 1,
    },
    methodInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
});