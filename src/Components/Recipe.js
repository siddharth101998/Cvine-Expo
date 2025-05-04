import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  UIManager,
  Platform,
  Share,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../authContext/AuthContext';
import debounce from 'lodash.debounce';

const API_BASE_URL = 'http://localhost:5002';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const RecipePage = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    items: [],
    method: '',
    bottles: [], // array of { id, name, image }
  });
  const [currentItem, setCurrentItem] = useState({ itemName: '', quantity: '' });
  const [availableBottles, setAvailableBottles] = useState([]);
  const [bottleSearchText, setBottleSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Hoisted fetchRecipes so it can be called from useEffect
  async function fetchRecipes() {
    try {
      const response = await axios.get(`${API_BASE_URL}/recipe/`);
      // Sort so newest recipes appear first
      setRecipes(response.data.slice().reverse());
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  }

  // Fetch available bottles on mount
  const fetchBottles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bottle/`);
      setAvailableBottles(response.data);
    } catch (error) {
      console.error('Error fetching bottles:', error);
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchBottles();
  }, []);

  // Debounced bottle search
  const fetchsearchBottles = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/bottle/search`, {
        params: { q: query },
      });
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };
  const debouncedSearch = debounce(fetchsearchBottles, 300);

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
      // Prepend the newly created recipe to show it at the top
      setRecipes((prev) => [response.data, ...prev]);
      setNewRecipe({ name: '', items: [], method: '', bottles: [] });
      setShowAddRecipe(false);
    } catch (error) {
      console.error('Error creating recipe:', error);
    }
  };

  const handleRemoveBottle = (id) => {
    setNewRecipe((prev) => ({
      ...prev,
      bottles: prev.bottles.filter((b) => b.id !== id),
    }));
  };

  const openModal = (item) => {
    setSelectedRecipe(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRecipe(null);
  };


  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleLike = async (id) => {
    try {
      await axios.put(`http://localhost:5002/recipe/like`, {
        recipeId: id,
        userId: user._id,
      });
      fetchRecipes();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDislike = async (id) => {
    try {
      await axios.put(`http://localhost:5002/recipe/dislike`, {
        recipeId: id,
        userId: user._id,
      });
      fetchRecipes();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = (id) => {
    // TODO: implement save/bookmark logic
    console.log('Saved recipe', id);
  };

  const handleShare = (item) => {
    Share.share({
      message: `Check out this recipe: ${item.name}\nIngredients: ${item.ingredients
        .map((ing) => ing.itemName)
        .join(', ')}\nMethod: ${item.method}`,
    });
  };

  const renderRecipe = ({ item }) => {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => openModal(item)}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.name}
          </Text>
          {item.expertRecommendation && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Recommended</Text>
            </View>
          )}
        </View>

        {/* Byline */}
        <Text style={styles.byline}>By {item.userName}</Text>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item._id)}>
            <Ionicons
              name={item.likedusers.includes(user._id) ? 'heart' : 'heart-outline'}
              size={24}
              color={item.likedusers.includes(user._id) ? '#e74c3c' : '#555'}
            />
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSave(item._id)}>
            <Ionicons
              name={item.savedusers?.includes(user._id) ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={item.savedusers?.includes(user._id) ? '#2E8B57' : '#555'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item)}>
            <Ionicons name="share-outline" size={24} color="#555" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageTitleContainer}>
        <Ionicons name="wine-outline" size={24} color="#333" style={{ marginRight: 4 }} />
        <Text style={styles.pageTitle}>Cocktail</Text>
        <Text style={styles.pageTitle}> / </Text>
        <Ionicons name="leaf-outline" size={24} color="#333" style={{ marginHorizontal: 4 }} />
        <Text style={styles.pageTitle}>Mocktail Recipes</Text>
      </View>
      <TouchableOpacity style={styles.createButton} onPress={() => setShowAddRecipe(!showAddRecipe)}>
        <Text style={styles.createButtonText}>Create</Text>
      </TouchableOpacity>
      <Modal
        visible={showAddRecipe}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddRecipe(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Recipe</Text>
              <TouchableOpacity onPress={() => setShowAddRecipe(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Recipe Name"
                value={newRecipe.name}
                onChangeText={(t) => setNewRecipe({ ...newRecipe, name: t })}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 0.45, marginRight: 8 }]}
                  placeholder="Item Name"
                  value={currentItem.itemName}
                  onChangeText={(t) => setCurrentItem({ ...currentItem, itemName: t })}
                />
                <TextInput
                  style={[styles.input, { flex: 0.45 }]}
                  placeholder="Quantity"
                  value={currentItem.quantity}
                  onChangeText={(t) => setCurrentItem({ ...currentItem, quantity: t })}
                />
                <TouchableOpacity style={styles.smallButton} onPress={handleAddItem}>
                  <Ionicons name="add-circle" size={28} color="#2E8B57" />
                </TouchableOpacity>
              </View>
              <Text style={styles.subHeader}>Items:</Text>
              {newRecipe.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemText}>{it.itemName}</Text>
                  <Text style={styles.itemQuantity}>{it.quantity}</Text>
                </View>
              ))}
              <TextInput
                style={styles.input}
                placeholder="Search Wines..."
                value={bottleSearchText}
                onChangeText={handleSearchbottle}
              />
              {searchResults.length > 0 && (
                <View style={styles.dropdown}>
                  <ScrollView style={{ maxHeight: 150 }}>
                    {searchResults.map((b) => (
                      <TouchableOpacity
                        key={b._id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setNewRecipe((prev) => ({
                            ...prev,
                            bottles: [...prev.bottles, { id: b._id, name: b.name, image: b.image }],
                          }));
                          setBottleSearchText('');
                          setSearchResults([]);
                        }}
                      >
                        <Text>{b.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              <Text style={styles.subHeader}>Selected Bottles:</Text>
              <View style={styles.selectedBottleContainer}>
                {newRecipe.bottles.map((b, i) => (
                  <View key={i} style={styles.selectedBottle}>
                    <Image source={{ uri: b.image }} style={styles.selectedBottleImage} />
                    <Text style={styles.selectedBottleName}>{b.name}</Text>
                    <TouchableOpacity onPress={() => handleRemoveBottle(b.id)}>
                      <Ionicons name="close-circle" size={18} color="#B22222" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="Method"
                multiline
                value={newRecipe.method}
                onChangeText={(t) => setNewRecipe({ ...newRecipe, method: t })}
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRecipe}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <FlatList
        key={'numCols-2'}
        data={recipes}
        keyExtractor={(item) => item._id}
        renderItem={renderRecipe}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRecipe && (
              <ScrollView>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
                  <TouchableOpacity onPress={closeModal}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                {selectedRecipe.expertRecommendation && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Recommended</Text>
                  </View>
                )}
                <Text style={styles.byline}>By {selectedRecipe.userName}</Text>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                  selectedRecipe.ingredients.map((ing, i) => (
                    <View key={i} style={styles.ingredientRow}>
                      <Ionicons 
                        name="ellipse" 
                        size={6} 
                        color="#555" 
                        style={{ marginRight: 8, marginTop: 10 }} 
                      />
                      <Text style={styles.sectionText}>
                        {ing.itemName}{ing.quantity ? `: ${ing.quantity}` : ''}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.sectionText, { fontStyle: 'italic' }]}>
                    No ingredients provided.
                  </Text>
                )}

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Method</Text>
                <Text style={styles.sectionText}>{selectedRecipe.method}</Text>

                {selectedRecipe.bottles?.length > 0 && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Bottles</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.bottleScroll}
                    >
                      {selectedRecipe.bottles.map((b, idx) => (
                        <View key={idx} style={styles.bottleItem}>
                          <Image source={{ uri: b.image }} style={styles.bottleImageModal} />
                          <Text style={styles.bottleName} numberOfLines={1}>{b.name}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RecipePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingHorizontal: 10,
    paddingTop: 10,
    top:65,
  },
  pageTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pageTitle: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'nowrap',
  },
  card: {
    width: SCREEN_WIDTH / 2 - 12,
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 6,
    elevation: 3,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  byline: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 14,
    color: '#777',
    marginVertical: 6,
    textAlign: 'center',
  },
  topIngredients: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  ingredientText: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 12,
    color: '#555',
    marginRight: 8,
  },
  moreText: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
  },
  expandText: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: '600',
    marginBottom: 6,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionText: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  bottleImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  bottleScroll: {
    paddingVertical: 8,
  },
  bottleItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  bottleImageModal: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  bottleName: {
    marginTop: 4,
    fontSize: 12,
    color: '#555',
    maxWidth: 80,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 13,
    color: '#555',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2E8B57',
    borderRadius: 8,
  },
  closeButtonText: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    color: '#fff',
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 8,
  },
  modalStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalStatText: {
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 14,
    color: '#555',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  bottomCloseButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2E8B57',
    borderRadius: 8,
  },
  createButton: {
    backgroundColor: '#2E8B57',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 12,
  },
  createButtonText: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addRecipeForm: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginTop: 4,
  },
  dropdownItem: {
    padding: 12,
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#555',
  },
  submitButton: {
    backgroundColor: '#2E8B57',
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  itemQuantity: {
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    fontSize: 14,
    color: '#555',
  },
  selectedBottleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectedBottle: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedBottleImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  selectedBottleName: {
    fontSize: 14,
    color: '#333',
    marginRight: 6,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});