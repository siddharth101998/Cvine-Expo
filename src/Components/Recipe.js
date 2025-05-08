import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
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
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../authContext/AuthContext';
import debounce from 'lodash.debounce';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { host } from '../API-info/apiifno';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
UIManager.setLayoutAnimationEnabledExperimental(true);
}


// Reusable recipe card with improved layout and tap targets
const RecipeCard = ({ item, onLike, onSave, onShare, onPress, userId }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => onPress(item)}>
    <View style={styles.cardImageContainer}>
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
    </View>
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.previewText} numberOfLines={2}>
        {item.method || item.ingredients?.map(i => i.itemName).join(', ')}...
      </Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onLike(item._id)}>
          <Ionicons
            name={item.likedusers.includes(userId) ? 'heart' : 'heart-outline'}
            size={20}
            color={item.likedusers.includes(userId) ? '#e74c3c' : '#777'}
          />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onSave(item._id)}>
          <Ionicons
            name={item.savedusers?.includes(userId) ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={item.savedusers?.includes(userId) ? '#2E8B57' : '#777'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onShare(item)}>
          <Ionicons name="share-outline" size={20} color="#777" />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

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
  imageUrl: '',
});
const [currentItem, setCurrentItem] = useState({ itemName: '', quantity: '' });
const [availableBottles, setAvailableBottles] = useState([]);
const [bottleSearchText, setBottleSearchText] = useState('');
const [profileImageUri, setProfileImageUri] = useState(null);
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
  console.log('Fetching comments for recipeId:', recipeId);
  try {
    const response = await axios.get(`${host}/recipe/comment/${recipeId}`);
    
    const data = response.data;
    console.log('Fetched comments:', data);
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
    const response = await axios.post(`${host}/recipe/comment`, {
        recipeId: selectedRecipe._id,
        userId: user._id,
        userName: user.name,
        comment: commentText.trim(),
    });
    console.log('Comment posted:', response.data);
    //setComments((prevComments) => [newComment, ...prevComments]); // Add new comment on top
    //setCommentText('');
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
      imageUrl: newRecipe.imageUrl, // Use the downloaded URL for backend submission
    };
    console.log('Submitting recipe:', payload);
    const response = await axios.post(`${host}/recipe/`, payload);
    setRecipes((prev) => [response.data, ...prev]);
    setNewRecipe({ name: '', items: [], method: '', bottles: [], imageUrl: '' });
    setProfileImageUri(null); // Reset the local preview
    setShowAddRecipe(false);

  } catch (error) {
    console.error('Error creating recipe:', error);
  }
  finally {
  setNewRecipe({ name: '', items: [], method: '', bottles: [], imageUrl: '' });
  setProfileImageUri(null); // Reset the local preview
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
    console.log('Adding comment:', user);
    const response = await axios.post(`${host}/recipe/comment`, {
        recipeId: selectedRecipe._id,
        userId: user._id,
        userName: user.username,
        comment: newComment.trim(), // <-- match the key used in your DB
      });
    console.log('Comment added:', response.data);

    const savedComment = response.data;
    setComments(prev => [savedComment, ...prev]);
    setNewComment('');
  } catch (error) {
    console.error('Error adding comment:', error);
  }
};

const handleDeleteComment = async (commentId) => {
  try {
    await axios.delete(`${host}/recipe/comment/${commentId}`);
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
const pickImage = async () => {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access the gallery is required!');
    return;
  }

  // Open image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  // Check if the user canceled
  const didCancel = result.cancelled ?? result.canceled;
  if (!didCancel) {
    // Get the local URI
    const uri = result.uri ?? result.assets?.[0]?.uri;
   
    // Set the local URI for preview
    setProfileImageUri(uri);

    // Upload the image and get the download URL
    // Note: You might want to handle the case where uri is undefined
    if (!uri) {
      console.error('Image URI is undefined');
      return;
    }
    console.log('Uploading image:', uri);
    const downloadUrl = await uploadAndProcessImage(uri);
    console.log("Download URL:", downloadUrl);

    // Save the download URL for backend submission
    setNewRecipe((prev) => ({
      ...prev,
      imageUrl: downloadUrl,
    }));
  }
};

const uploadAndProcessImage = async (uri) => {
  try {
    if (!uri) throw new Error('Image URI is undefined');
    console.log('Uploading image:', uri);
    // Convert the URI to a Blob
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new Error('Failed to convert URI to Blob'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
   

    // Upload the Blob to Firebase Storage
    const fileName = uri.split('/').pop();
    
    const storageRef = ref(storage, `recipe_images/${Date.now()}-${fileName}`);
  
    uploadBytes(storageRef, blob).then((snapshot) => {
      console.log('Uploaded a blob or file!', snapshot);
    
    });
  
    // Get the download URL
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('Image uploaded successfully:', downloadUrl);
    // Clean up the Bl
    blob.close();
    return downloadUrl;
  } catch (err) {
    console.error('Upload error:', err);
    Alert.alert('Upload Failed', err.message || 'There was a problem uploading the image.');
  }
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
        renderItem={({ item }) => (
          <RecipeCard
            item={item}
            onLike={handleLike}
            onSave={handleSave}
            onShare={handleShare}
            onPress={openModal}
            userId={user._id}
          />
        )}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
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
          <View style={styles.avatarContainer}>
        
    
      </View>
       <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={pickImage}>
                {profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={styles.avatarLarge} />
                ) : (
                  <Ionicons name="person-circle-outline" size={100} color="#B22222" />
                )}
              </TouchableOpacity>
              <Text style={styles.avatarText}>Tap to select an image</Text>
          </View>
          <View style={styles.divider} />
            
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
                <Ionicons name="add-circle" size={28} color="B22222" />
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
                          bottles: [...prev.bottles, { id: b._id, name: b.name, imageurl: b.image }],
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
                  <Image source={{ uri: b.imageUrl }} style={styles.selectedBottleImage} />
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
                  <Text style={styles.commentText}>{comment.comment}</Text>
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
                <Ionicons name="send" size={24} color={newComment.trim() ? '#B22222' : '#ccc'} />
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
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#eee',
  },
  cardContent: {
    padding: 12,
  },
  previewText: {
    fontSize: 13,
    color: '#555',
    marginVertical: 6,
  },
  container: {
    flex: 1,
    backgroundColor: '#f4f5fa',
  },
  header: {
    height: 150,
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
    color: '#B22222',
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
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#B22222',
    marginBottom: 12,
  },
  inlineDetailContainer: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inlineTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  inlineSectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    color: '#2E8B57',
  },
  inlineListItem: {
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 2,
    color: '#555',
  },
  inlineText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  inlineEmpty: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#999',
    marginLeft: 8,
  },
  inlineBottleScroll: {
    marginTop: 8,
  },
  inlineBottleItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  inlineBottleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  customModalContent: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#fdfdfd',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    resizeMode: 'cover',
    marginBottom: 12,
  },
});