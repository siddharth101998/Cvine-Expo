import { useEffect, useState } from "react";
import { FlatList, Dimensions, Text, TouchableOpacity, StyleSheet, View, Modal, TextInput, Button, ScrollView, Image, LayoutAnimation, UIManager, Platform } from "react-native";
import { useAuth } from "../authContext/AuthContext";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { host } from '../API-info/apiifno';
const { width: SCREEN_WIDTH } = Dimensions.get('window');



// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RecipeCard = ({ item, onLike, onSave, onDislike, onShare, onPress, userId }) => (
    <TouchableOpacity style={[styles.card, styles.horizontalCard]} activeOpacity={0.9} onPress={() => onPress(item)}>
        <View style={styles.cardImageContainerHorizontal}>
            {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardImageHorizontal} />
            ) : (
                <View style={[styles.cardImagePlaceholder, styles.iconPlaceholder]}>
                    <Ionicons name="wine-outline" size={40} color="#B22222" />
                </View>
            )}
        </View>
        <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.previewText} numberOfLines={2}>
                {item.method || item.ingredients?.map(i => i.itemName).join(', ')}...
            </Text>
        </View>
    </TouchableOpacity>
);


export default function UserRecipes() {
    const [userRecipes, setUserRecipes] = useState([]);
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [activeTab, setActiveTab] = useState('my'); // 'my' or 'saved'
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const { user } = useAuth();
    const navigation = useNavigation();

    useEffect(() => {
        const fetchUserRecipes = async () => {
            try {
                const response = await axios.get(`${host}/recipe/user/${user._id}`);
                setUserRecipes(response.data);
            } catch (error) {
                console.error("Error fetching user recipes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserRecipes();
    }, [user._id]);

    useEffect(() => {
        const fetchSaved = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${host}/recipe/saved/${user._id}`);
                setSavedRecipes(res.data);
            } catch (err) {
                console.error('Error fetching saved recipes:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSaved();
    }, [user._id]);

    const handleEditRecipe = async () => {
        try {
            await axios.put(`${host}/recipe/${selectedRecipe._id}`, selectedRecipe);
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
            await axios.delete(`${host}/recipe/${recipeId}`);
            const updatedRecipes = userRecipes.filter(recipe => recipe._id !== recipeId);
            setUserRecipes(updatedRecipes);
        } catch (error) {
            console.error("Error deleting recipe:", error);
        }
    };

    const handleLike = async (recipeId) => {
        try {
            await axios.post(`${host}/recipe/like/${recipeId}`, { userId: user._id });
            const updateLikes = (recipes) => recipes.map(recipe => {
                if (recipe._id === recipeId) {
                    let likedusers = recipe.likedusers || [];
                    let dislikedusers = recipe.dislikedusers || [];
                    if (!likedusers.includes(user._id)) {
                        likedusers = [...likedusers, user._id];
                        dislikedusers = dislikedusers.filter(id => id !== user._id);
                    }
                    return { ...recipe, likedusers, dislikedusers, likes: likedusers.length, dislikes: dislikedusers.length };
                }
                return recipe;
            });
            setUserRecipes(updateLikes(userRecipes));
            setSavedRecipes(updateLikes(savedRecipes));
        } catch (error) {
            console.error('Error liking recipe:', error);
        }
    };

    const handleSave = async (recipeId) => {
        try {
            await axios.post(`${host}/recipe/save/${recipeId}`, { userId: user._id });
            const updateSaved = (recipes) => recipes.map(recipe => {
                if (recipe._id === recipeId) {
                    let savedusers = recipe.savedusers || [];
                    if (!savedusers.includes(user._id)) {
                        savedusers = [...savedusers, user._id];
                    } else {
                        savedusers = savedusers.filter(id => id !== user._id);
                    }
                    return { ...recipe, savedusers };
                }
                return recipe;
            });
            setUserRecipes(updateSaved(userRecipes));
            setSavedRecipes(updateSaved(savedRecipes));
        } catch (error) {
            console.error('Error saving recipe:', error);
        }
    };

    const handleShare = async (item) => {
        try {
            await Share.share({
                message: `Check out this recipe: ${item.name}\n\nIngredients:\n${item.ingredients?.map(i => `${i.itemName} - ${i.quantity}`).join('\n')}\n\nMethod:\n${item.method}`,
            });
        } catch (error) {
            alert(error.message);
        }
    };

    const closeDetailModal = () => {
        setSelectedRecipe(null);
        setDetailModalVisible(false);
    };

    if (loading) {
        return <Text>Loading...</Text>;
    }
    if (userRecipes.length === 0) {
        return <Text>No recipes found.</Text>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('my')}
                >

                    <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>My Recipes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'saved' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('saved')}
                >
                    <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>Saved Recipes</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={activeTab === 'my' ? userRecipes : savedRecipes}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <RecipeCard
                        item={item}
                        onLike={handleLike}
                        onSave={handleSave}
                        onDislike={handleDeleteRecipe}
                        onShare={handleShare}
                        onPress={item => {
                            setSelectedRecipe(item);
                            setDetailModalVisible(true);
                        }}
                        userId={user._id}
                    />
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
            <Modal
                visible={detailModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeDetailModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedRecipe && (
                            <ScrollView contentContainerStyle={styles.modalScroll}>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity onPress={closeDetailModal} style={styles.backButton}>
                                        <Ionicons name="arrow-back" size={24} color="#333" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
                                {selectedRecipe.imageUrl ? (
                                    <Image source={{ uri: selectedRecipe.imageUrl }} style={styles.detailImage} />
                                ) : (
                                    <View style={[styles.detailImage, styles.iconPlaceholder]}>
                                        <Ionicons name="wine-outline" size={80} color="#B22222" />
                                    </View>
                                )}
                                <Text style={styles.sectionTitle}>Ingredients:</Text>
                                {selectedRecipe.ingredients.map((ingredient, index) => (
                                    <Text key={index} style={styles.detailText}>
                                        {ingredient.itemName} - {ingredient.quantity}
                                    </Text>
                                ))}
                                <Text style={styles.sectionTitle}>Method:</Text>
                                <Text style={styles.detailText}>{selectedRecipe.method}</Text>
                                {selectedRecipe.bottles?.length > 0 && (
                                    <>
                                        <Text style={styles.sectionTitle}>Bottles:</Text>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.bottleScroll}
                                        >
                                            {selectedRecipe.bottles.map((bottle, idx) => (
                                                <View key={idx} style={styles.bottleItem}>
                                                    {bottle.imageUrl ? (
                                                        <Image
                                                            source={{ uri: bottle.imageUrl }}
                                                            style={styles.bottleImageModal}
                                                            resizeMode="contain"
                                                        />
                                                    ) : (
                                                        <View style={styles.bottleImageModal} />
                                                    )}
                                                    <Text style={styles.bottleName} numberOfLines={2}>
                                                        {bottle.name}
                                                    </Text>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </>
                                )}
                                {activeTab === 'my' && (
                                    <View style={styles.modalActionsRow}>
                                        <TouchableOpacity
                                            style={styles.modalActionButton}
                                            onPress={() => {
                                                setIsModalVisible(true);
                                                setDetailModalVisible(false);
                                            }}
                                        >
                                            <Ionicons name="create-outline" size={24} color="#2E8B57" />
                                            <Text style={styles.modalActionText}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.modalActionButton}
                                            onPress={() => {
                                                handleDeleteRecipe(selectedRecipe._id);
                                                closeDetailModal();
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={24} color="#e74c3c" />
                                            <Text style={styles.modalActionText}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
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
    horizontalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        height: 120,
    },
    cardImageContainerHorizontal: {
        width: 100,
        height: 100,
        borderRadius: 10,
        overflow: 'hidden',
        marginRight: 10,
        backgroundColor: '#ddd',
    },
    cardImageHorizontal: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardImagePlaceholder: {
        width: 100,
        height: 100,
        backgroundColor: '#ccc',
        borderRadius: 10,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    previewText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    actionText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#555',
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
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
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
    tabBar: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        backgroundColor: '#eee',
        alignItems: 'center',
        borderRadius: 4,
        marginHorizontal: 4,
    },
    tabButtonActive: {
        backgroundColor: '#B22222',
    },
    tabText: {
        fontSize: 16,
        color: '#333',
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalScroll: {
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    backButton: {
        marginRight: 10,
    },
    detailImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 10,
        resizeMode: 'cover',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        color: '#333',
    },
    detailText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 5,
    },
    modalActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    modalActionButton: {
        alignItems: 'center',
    },
    modalActionText: {
        marginTop: 4,
        fontSize: 14,
        color: '#333',
    },
    bottleScroll: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    bottleItem: {
        alignItems: 'center',
        marginRight: 12,
        width: 100,
    },
    bottleImageModal: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        marginBottom: 4,
    },
    bottleName: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
        width: 100,
        flexWrap: 'wrap',
    },
    iconPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
});
