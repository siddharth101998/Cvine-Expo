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
KeyboardAvoidingView,
Platform,
Share,
ScrollView,
Keyboard,
Dimensions,
Modal,
TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../authContext/AuthContext';
import debounce from 'lodash.debounce';
import { LinearGradient } from 'expo-linear-gradient';

import { host } from '../API-info/apiifno';

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
const [comments, setComments] = useState([]);
const [newComment, setNewComment] = useState(''); // Add state for newComment
const [commentText, setCommentText] = useState('');
const [loadingComments, setLoadingComments] = useState(false);
const [error, setError] = useState(null);
const [loading, setLoading] = useState(true);


useEffect(() => {
  fetchRecipes();
  fetchBottles();
}, 
[]);


// Hoisted fetchRecipes so it can be called from useEffect
async function fetchRecipes() {
  try {
    const response = await axios.get(`${host}/recipe/`);
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
    const response = await axios.get(`${host}/bottle/`);
    setAvailableBottles(response.data);
  } catch (error) {
    console.error('Error fetching bottles:', error);
  }
};


useEffect(() => {
  if (selectedRecipe) { fetchComments(selectedRecipe._id);
  }
}, [selectedRecipe]);

// Fetch Comments
const fetchComments = async (recipeId) => {
  setLoadingComments(true);
  setError(null);
  try {
    const response = await fetch(`${host}/comment/${recipeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    const data = await response.json();
    setComments(data.reverse()); // Optional: newest first
  } catch (err) {
    console.error(err);
    setError(err.message);
  } finally {
    setLoadingComments(false);
  }
};

// Post Comment
const postComment = async () => {
  if (!commentText.trim()) return; // Prevent empty comments

  try {
    const response = await fetch(`${host}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization if needed
        // Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        recipeId: selectedRecipe._id,
        userId: user._id,
        userName: user.name,
        comment: commentText.trim(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to post comment');
    }

    const newComment = await response.json();
    setComments((prevComments) => [newComment, ...prevComments]); // Add new comment on top
    setCommentText('');
  } catch (err) {
    console.error(err);
    alert('Error posting comment: ' + err.message);
  }
};


    
// Debounced bottle search
const fetchsearchBottles = async (query) => {
  if (!query) {
    setSearchResults([]);
    return;
  }
  try {
    const response = await axios.get(`${host}/bottle/search`, {
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
    const response = await axios.post(`${host}/recipe/`, payload);
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
const handleLike = async (id) => {
  try {
    await axios.put(`${host}/recipe/like`, {
      recipeId: id,
      userId: user._id,
    });
    // setRecipes((prev) =>
    //   prev.map((r) =>
    //     r._id === id ? { ...r, likes: r.likes + 1, likedusers: [...r.likedusers, user._id] } : r
    //   )
    // );
    fetchRecipes();
  } catch (error) {
    console.error(error);
  }
};

const handleDislike = async (id) => {
  try {
    await axios.put(`${host}/recipe/dislike`, {
      recipeId: id,
      userId: user._id,
    });
    fetchRecipes();
  } catch (error) {
    console.error(error);
  }
};

const openModal = async (item) => {
  setSelectedRecipe(item);
  setModalVisible(true);
};

const closeModal = () => {
  setModalVisible(false);
  setSelectedRecipe(null);
};

const handleAddComment = async () => {
  if (!newComment.trim()) return;

  try {
    const response = await fetch(`${host}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipeId: selectedRecipe._id,
        userId: user._id,
        userName: user.name,
        text: newComment.trim(), // <-- match the key used in your DB
      }),
    });

    const savedComment = await response.json();
    setComments(prev => [savedComment, ...prev]);
    setNewComment('');
  } catch (error) {
    console.error('Error adding comment:', error);
  }
};

const handleDeleteComment = async (commentId) => {
  try {
    await fetch(`${host}/comments/${commentId}`, {
      method: 'DELETE',
    });
    setComments(prev => prev.filter(comment => comment._id !== commentId));
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
};


const toggleExpand = (id) => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setExpandedIds((prev) =>
    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
  );
};



// const handleSave = (id) => {
//   // TODO: implement save/bookmark logic
//   console.log('Saved recipe', id);
// };

const handleShare = (item) => {
  Share.share({
    message: `Check out this recipe: ${item.name}\nIngredients: ${item.ingredients
      .map((ing) => ing.itemName)
      .join(', ')}\nMethod: ${item.method}`,
  });
};

const renderRecipe = ({ item }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => openModal(item)}
    >
      {/* Recipe Image */}
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />

      {/* Recipe Details */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardSubtitle}>By {item.userName}</Text>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleLike(item._id)}>
            <Ionicons
              name={item.likedusers.includes(user._id) ? 'heart' : 'heart-outline'}
              size={20}
              color={item.likedusers.includes(user._id) ? '#e74c3c' : '#555'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(item)}>
            <Ionicons name="share-outline" size={20} color="#555" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

return (
  <View style={styles.container}>
    {/* Header */}
    <LinearGradient
      colors={['#B22222', '#FF6347']}
      style={styles.header}
    >
      <Text style={styles.headerText}>Cocktail / Mocktail Recipes</Text>
    </LinearGradient>

    {/* Create Recipe Button */}
    <TouchableOpacity
      style={styles.createButton}
      onPress={() => setShowAddRecipe(!showAddRecipe)}
    >
      <Text style={styles.createButtonText}>Create Recipe</Text>
    </TouchableOpacity>

    {/* Recipe List */}
    {loading ? (
      <Text style={styles.loadingText}>Loading...</Text>
    ) : (
      <FlatList
        data={recipes}
        keyExtractor={(item) => item._id}
        renderItem={renderRecipe}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
    )}

    {/* Create Recipe Modal */}
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
            {/* Form Fields */}
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
                <Ionicons name="add-circle" size={28} color="#B22222" />
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
   <Modal
  visible={modalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={closeModal}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {selectedRecipe && (
        <ScrollView contentContainerStyle={styles.modalScroll}>
          {/* Header with Back Button */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.backButton} onPress={closeModal}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
          </View>
          <View style={styles.divider} />

          {/* Recommended Badge */}
          {selectedRecipe.expertRecommendation && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Recommended</Text>
            </View>
          )}

          {/* Ingredients Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {selectedRecipe.ingredients?.length > 0 ? (
              selectedRecipe.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <Ionicons name="ellipse" size={6} color="#555" style={styles.bulletIcon} />
                  <Text style={styles.sectionText}>
                    {ing.itemName}
                    {ing.quantity ? `: ${ing.quantity}` : ''}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.sectionTextItalic}>No ingredients provided.</Text>
            )}
          </View>
          <View style={styles.divider} />

          {/* Method Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Method</Text>
            <Text style={styles.sectionText}>{selectedRecipe.method || 'No method provided.'}</Text>
          </View>
          <View style={styles.divider} />

          {/* Bottles Section */}
          {selectedRecipe.bottles?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bottles</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bottleScroll}
              >
                {selectedRecipe.bottles.map((b, idx) => (
                  <View key={idx} style={styles.bottleItem}>
                    <Image source={{ uri: b.image }} style={styles.bottleImageModal} />
                    <Text style={styles.bottleName} numberOfLines={1}>
                      {b.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          <View style={styles.divider} />

          {/* Comments Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments</Text>
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <View key={index} style={styles.commentRow}>
                  <Text style={styles.commentAuthor}>
                    {comment.userName || 'Anonymous'}:
                  </Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  {comment.userId === user._id && (
                    <TouchableOpacity onPress={() => handleDeleteComment(comment._id)}>
                      <Ionicons name="trash" size={20} color="red" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.sectionTextItalic}>No comments yet.</Text>
            )}

            {/* Add Comment Input */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity onPress={handleAddComment} disabled={!newComment.trim()}>
                <Ionicons name="send" size={24} color={newComment.trim() ? '#2E8B57' : '#ccc'} />
              </TouchableOpacity>
            </View>
          </View>
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
    backgroundColor: '#f4f5fa',
  },
  header: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#B22222',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 16,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    alignItems: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
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
    alignItems: 'center',
    marginBottom: 6,
  },
  bulletIcon: {
    marginRight: 8,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  commentAuthor: {
    fontWeight: 'bold',
    color: '#2E8B57',
    marginRight: 6,
  },
  commentText: {
    flex: 1,
    color: '#333',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    padding: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
});