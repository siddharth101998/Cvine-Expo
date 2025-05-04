// src/Components/Profile/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Animated } from 'react-native';
import { useAuth } from '../../authContext/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileScreen = () => {
  const { user, updateUser } = useAuth();
  const [profileImageUri, setProfileImageUri] = useState(user.profileImage || null);
  const [wishlistBottles, setWishlistBottles] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [recipeCount, setRecipeCount] = useState(0);
  const [activeTab, setActiveTab] = useState('wishlist');
  const navigation = useNavigation();

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`http://localhost:5002/wishlist/${user._id}`);
      console.log(res.data.bottles)
      setWishlistBottles(res.data.bottles);
    } catch (error) {
      console.error("Error fetching wishlist bottles:", error);
    }
  };

  



  // const fetchSearchHistory = async () => {
  //   if (!user) return;
  //   try {
  //     const res = await axios.get(`http://localhost:5002/searchHistory/${user._id}`);
  //     const payload = res.data;
  //     // Determine array of history entries
  //     const historyItems = Array.isArray(payload)
  //       ? payload
  //       : payload.bottles
  //       ? payload.bottles
  //       : payload.searchHistory
  //       ? payload.searchHistory
  //       : [];
  //     // Extract names: if each item is a bottle object, take its name; 
  //     // if it's a record with its own bottles array, dig into that; otherwise skip.
  //     const names = historyItems.flatMap(item => {
  //       if (item.name) {
  //         // direct bottle object
  //         return item.name;
  //       } else if (item.bottles && Array.isArray(item.bottles)) {
  //         // record with bottles array
  //         return item.bottles.map(b => b.name);
  //       }
  //       return [];
  //     });
  //     // remove duplicates
  //     const uniqueNames = Array.from(new Set(names));
  //     setSearchHistory(uniqueNames);
  //   } catch (error) {
  //     console.error("Error fetching search history:", error);
  //   }
  // };
  const fetchRecipeCount = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`http://localhost:5002/recipe/count/${user._id}`);
      console.log("recipe count response:", res.data.count);
      setRecipeCount(res.data.count);
    } catch (error) {
      console.error("Error fetching count of recipes :", error);
    }
  };

  const fetchSearchHistory = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`http://localhost:5002/searchHistory/${user._id}`);
      console.log("searchhistory response:", res.data.length);

      setSearchHistory(res.data);
    } catch (error) {
      console.error("Error fetching search bottles:", error);
    }
  };
  const pickImage = async () => {
    // request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery is required!');
      return;
    }
    // open image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    // Determine if the user canceled; new API uses 'canceled', old uses 'cancelled'
    const didCancel = result.cancelled ?? result.canceled;
    if (!didCancel) {
      // get URI from legacy or new assets array
      const uri = result.uri ?? result.assets?.[0]?.uri;
      console.log("Picked image URI:", uri);
      setProfileImageUri(uri);
      // persist in context/backend
      updateUser({ profileImage: uri });
      // optionally: send to server to save permanently
    }
  };

  useEffect(() => {
    // Fetch user data when the component mounts
    //fetchUser();
    fetchRecipeCount();
    fetchWishlist();
    fetchSearchHistory();
  }, [user]);

  if (!user) {
    return (
      <>
        <View style={styles.screen}>
          <Text>Loading profile…</Text>
        </View>
        <View style={styles.divider} />
      </>
    );
  }

  // Prepare badgeDetails array if user.badges exists, else empty array
  const badgeDetails = Array.isArray(user.badges) ? user.badges.map(badgeId => {
    // For demonstration, assume badgeId is an object with _id and badgeLogo
    // In case badgeId is just a string, create a placeholder
    if (typeof badgeId === 'object' && badgeId._id && badgeId.badgeLogo) {
      return badgeId;
    }
    // Otherwise, create a placeholder object with badgeLogo as a placeholder image URL
    return { _id: badgeId, badgeLogo: 'https://via.placeholder.com/40' };
  }) : [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Gradient Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {/* settings action */ }}>
          <Ionicons name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {/* Avatar and name */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.avatarLarge} />
          ) : (
            <Ionicons name="person-circle-outline" size={100} color="black" />
          )}
        </TouchableOpacity>
        <Text style={styles.usernameWhite}>{user.username}</Text>
      </View>
      <View style={styles.statsOverlay}>
        <View style={[styles.statBox, { backgroundColor: '#fff' }]}>
          <Text style={[styles.statNumber, { color: 'black' }]}>{recipeCount}</Text>
          <Text style={styles.statLabel}>
          <TouchableOpacity onPress={() => navigation.navigate('UserRecipes', { userId: user._id })}>
                        <Text style={{ color: 'black', fontSize: 16 }}>Recipes</Text>
                    </TouchableOpacity>
            </Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#fff' }]}>
          <Text style={[styles.statNumber, { color: 'black' }]}>{badgeDetails.length}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={styles.badgesList}>
          {badgeDetails.map(badge => (
            <Image
              key={badge._id}
              source={{ uri: badge.badgeLogo }}
              style={styles.badgeLogo}
            />
          ))}
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wishlist' && styles.activeTab]}
          onPress={() => setActiveTab('wishlist')}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>
            Wishlist
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Search History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'wishlist' ? (
        wishlistBottles.map((item, idx) => (

          <TouchableOpacity
            key={item._id ?? idx.toString()}
            style={styles.listItem}
            onPress={() => navigation.navigate('Bottle', { id: item._id })}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            <Text style={styles.listText}>{item.name}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.section}>
          {searchHistory.map((item, idx) => (

            <TouchableOpacity
              key={item._id ?? idx.toString()}
              style={styles.listItem}
              onPress={() => navigation.navigate('Bottle', { id: item.bottle._id })}

            >
              <Image source={{ uri: item.bottle.imageUrl }} style={styles.cardImage} />
              <Text style={styles.listText}>{item.bottle.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f5fa',
    top: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 50,
    width: '100%',
  },
  gradientHeader: {
    height: 220,
    paddingTop: 50,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  usernameWhite: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 'bold',
    color: 'Black',
  },
  statsOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 22,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 8,
    borderRadius: 12,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5b3dff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'black',
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badgeLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  listItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    // subtle card style
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listText: {
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#5b3dff',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  cardImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    objectFit: 'contain'
  },
});