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
Alert, // <--- add this
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
const RecipeCard = ({ item, onLike, onSave, onDislike, onShare, onPress, userId }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => onPress(item)}>
    <View style={styles.cardImageContainer}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder} />
      )}
    </View>
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.previewText} numberOfLines={2}>
        {item.method || item.ingredients?.map(i => i.itemName).join(', ')}...
      </Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onLike(item._id)}>
          <Ionicons
            name={item.likedusers.includes(userId) ? 'thumbs-up' : 'thumbs-up-outline'}
            size={20}
            color={item.likedusers.includes(userId) ? '#2E8B57' : '#777'}
          />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onDislike(item._id)}>
          <Ionicons
            name={item.dislikedusers.includes(userId) ? 'thumbs-down' : 'thumbs-down-outline'}
            size={20}
            color={item.dislikedusers.includes(userId) ? '#e74c3c' : '#777'}
          />
          <Text style={styles.actionText}>{item.dislikes}</Text>
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
    setAvailableBottles(Array.isArray(response.data) ? response.data : []);
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

const handleRemoveItem = (index) => {
  setNewRecipe((prev) => ({
    ...prev,
    items: prev.items.filter((_, i) => i !== index),
  }));
};

const handleSubmitRecipe = async () => {
  // Validation: all fields mandatory, at least one item
  if (!newRecipe.name.trim()) {
    Alert.alert('Validation Error', 'Recipe name is required.');
    return;
  }
  if (newRecipe.items.length < 1) {
    Alert.alert('Validation Error', 'Please add at least one ingredient item.');
    return;
  }
  if (newRecipe.bottles.length < 1) {
    Alert.alert('Validation Error', 'Please select at least one bottle.');
    return;
  }
  if (!newRecipe.method.trim()) {
    Alert.alert('Validation Error', 'Recipe method is required.');
    return;
  }
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
  console.log('handleLike called for recipeId:', id);
  try {
    const response = await axios.put(`${host}/recipe/like`, {
      recipeId: id,
      userId: user._id,
    });
    console.log('handleLike response data:', response.data);
    fetchRecipes();
  } catch (error) {
    console.error('Error liking recipe:', error);
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

const handleSave = async (id) => {
  console.log('handleSave called for recipeId:', id);
  try {
    const response = await axios.put(`${host}/recipe/save`, {
      recipeId: id,
      userId: user._id,
    });
    console.log('handleSave response data:', response.data);
    fetchRecipes();
  } catch (error) {
    console.error('Error saving recipe:', error);
  }
};

const openModal = (item) => {
  // Enrich bottle entries with imageUrl from fetched bottles list
  const enrichedBottles = item.bottles.map(b => {
    const match = (availableBottles || []).find(av => av._id === b.id);
    return {
      ...b,
      imageUrl: match?.imageUrl || b.imageUrl || null,
    };
  });
  setSelectedRecipe({ ...item, bottles: enrichedBottles });
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
      comment: newComment.trim(),
    });
    console.log('Comment added:', response.data);
    // Refresh comments so commenterName is populated immediately
    await fetchComments(selectedRecipe._id);
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
    if (error.response?.status === 404) {
      Alert.alert('Comment not found', 'It may have already been deleted.');
      setComments(prev => prev.filter(comment => comment._id !== commentId));
    } else {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', 'Failed to delete comment. Please try again.');
    }
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
  // Request camera permissions
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access camera is required!');
    return;
  }

  // Launch camera
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.cancelled || result.canceled) {
    return;
  }

  // Get the local URI
  const uri = result.uri ?? result.assets?.[0]?.uri;
  if (!uri) {
    console.error('Image URI is undefined');
    return;
  }

  // Preview
  setProfileImageUri(uri);

  // Upload to Firebase
  try {
    // Convert to Blob
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new Error('Failed to convert URI to Blob'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
    const fileName = uri.split('/').pop();
    const storageRef = ref(storage, `recipe_images/${Date.now()}-${fileName}`);
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('Image uploaded successfully:', downloadUrl);
    setNewRecipe(prev => ({ ...prev, imageUrl: downloadUrl }));
    blob.close();
  } catch (err) {
    console.error('Upload error:', err);
    alert('Upload Failed: ' + (err.message || 'Problem uploading image.'));
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
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder} />
      )}

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
      <Text style={styles.createButtonText}>Add Your Recipe</Text>
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
            onDislike={handleDislike}
            onShare={handleShare}
            onPress={openModal}
            userId={user._id}
          />
        )}
        contentContainerStyle={styles.listContent}
        numColumns={1}
        key={1}
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
            <Text style={styles.modalTitle}>Add Your Recipe</Text>
            <TouchableOpacity onPress={() => setShowAddRecipe(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.avatarLarge} />
          ) : (
            <Ionicons name="wine-outline" size={100} color="#B22222" />
          )}
        </TouchableOpacity>
        <Text style={styles.avatarText}>Tap to select image</Text>
      </View>
          <View style={styles.divider} />
            
            {/* Form Fields */}
            <Text style={styles.inputLabel}>
              Recipe Name <Text style={styles.requiredIcon}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={newRecipe.name}
              onChangeText={(t) => setNewRecipe({ ...newRecipe, name: t })}
            />
            <Text style={styles.inputLabel}>
              Add Ingredient <Text style={styles.requiredIcon}>*</Text>
            </Text>
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
           <View style={styles.itemsContainer}>
             {newRecipe.items.map((it, idx) => (
               <View key={idx} style={styles.itemTag}>
                 <Text style={styles.itemTagText}>{it.itemName}</Text>
                 {it.quantity ? (
                   <Text style={styles.itemTagQuantity}>{it.quantity}</Text>
                 ) : null}
                 <TouchableOpacity onPress={() => handleRemoveItem(idx)} style={styles.itemTagRemove}>
                   <Ionicons name="close-circle" size={16} color="#e74c3c" />
                 </TouchableOpacity>
               </View>
             ))}
           </View>
            <Text style={styles.inputLabel}>
              Select Bottles <Text style={styles.requiredIcon}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={bottleSearchText}
              onChangeText={handleSearchbottle}
              placeholder="Search Wines..."
            />
            {searchResults.length > 0 && (
              <View style={[styles.dropdown, styles.dropdownWrapper]}>
                <ScrollView>
                  {searchResults.map((b) => (
                    <TouchableOpacity
                      key={b._id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setNewRecipe((prev) => ({
                          ...prev,
                          bottles: [
                            ...prev.bottles,
                            { id: b._id, name: b.name, imageUrl: b.imageUrl },
                          ],
                        }));
                        setBottleSearchText('');
                        setSearchResults([]);
                      }}
                    >
                      {b.imageUrl && (
                        <Image source={{ uri: b.imageUrl }} style={styles.dropdownItemImage} />
                      )}
                      <Text style={styles.dropdownItemText}>{b.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <Text style={styles.subHeader}>Selected Bottles:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedBottleContainer}
            >
              {newRecipe.bottles.map((b, i) => (
                <View key={i} style={styles.selectedBottleCard}>
                  <Image source={{ uri: b.imageUrl }} style={styles.selectedBottleCardImage} />
                  <TouchableOpacity
                    style={styles.selectedBottleCardRemove}
                    onPress={() => handleRemoveBottle(b.id)}
                  >
                    <Ionicons name="close-circle" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                  <Text style={styles.selectedBottleCardName} numberOfLines={1}>
                    {b.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>
              Method <Text style={styles.requiredIcon}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              multiline
              value={newRecipe.method}
              onChangeText={(t) => setNewRecipe({ ...newRecipe, method: t })}
              placeholder="Method"
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
          {/* Show recipe image at top */}
          {selectedRecipe.imageUrl && (
            <Image source={{ uri: selectedRecipe.imageUrl }} style={styles.modalImage} />
          )}
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
                    <Image source={{ uri: b.imageUrl }} style={styles.bottleImageModal} />
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
                    {comment.commenterName || comment.userName }:
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
          <View style={styles.modalActionsRow}>
            <TouchableOpacity onPress={() => handleLike(selectedRecipe._id)} style={styles.modalAction}>
              <Ionicons
                name={selectedRecipe.likedusers.includes(user._id) ? 'thumbs-up' : 'thumbs-up-outline'}
                size={24}
                color={selectedRecipe.likedusers.includes(user._id) ? '#e74c3c' : '#777'}
              />
              <Text style={styles.modalActionText}>{selectedRecipe.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDislike(selectedRecipe._id)} style={styles.modalAction}>
              <Ionicons
                name={selectedRecipe.dislikedusers.includes(user._id) ? 'thumbs-down' : 'thumbs-down-outline'}
                size={24}
                color={selectedRecipe.dislikedusers.includes(user._id) ? '#3498db' : '#777'}
              />
              <Text style={styles.modalActionText}>{selectedRecipe.dislikes}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSave(selectedRecipe._id)} style={styles.modalAction}>
              <Ionicons
                name={selectedRecipe.savedusers?.includes(user._id) ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={selectedRecipe.savedusers?.includes(user._id) ? '#2E8B57' : '#777'}
              />
            </TouchableOpacity>
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
    paddingHorizontal: 100,
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
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
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
  dropdownWrapper: {
    position: 'absolute',
    top: 180,            // adjust as needed to sit below the search input
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  dropdownItemImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
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
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  itemTag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTagText: {
    fontSize: 14,
    color: '#333',
  },
  itemTagQuantity: {
    fontSize: 12,
    color: '#555',
    marginLeft: 6,
  },
  itemTagRemove: {
    marginLeft: 6,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectedBottleCard: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
    position: 'relative',
  },
  selectedBottleCardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 6,
  },
  selectedBottleCardRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  selectedBottleCardName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#777',
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
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 12,
  },
  modalAction: {
    alignItems: 'center',
  },
  modalActionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  requiredIcon: {
    color: '#e74c3c',
  },
});