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
import { host } from '../../API-info/apiifno';
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
      const res = await axios.get(`${host}/wishlist/${user._id}`);
      console.log(res.data.bottles)
      setWishlistBottles(res.data.bottles);
    } catch (error) {
      console.error("Error fetching wishlist bottles:", error);
    }
  };

  



  // const fetchSearchHistory = async () => {
  //   if (!user) return;
  //   try {
  //     const res = await axios.get(`${host}/searchHistory/${user._id}`);
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
      console.log("user id:", user._id);
      const res = await axios.get(`http://localhost:5002/recipe/count/${user._id}`);
      console.log("recipe count response:", res.data);
      setRecipeCount(res.data.count);
    } catch (error) {
      console.error("Error fetching count of recipes :", error);
    }
  };

  const fetchSearchHistory = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${host}/searchHistory/${user._id}`);
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
    console.log(user.badges);
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
      <LinearGradient
        colors={['#B22222', '#FF6347']}
        style={styles.gradientHeader}
      >
        <TouchableOpacity onPress={() => {/* settings action */ }}>
          <Ionicons name="settings-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Avatar and Username */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.avatarLarge} />
          ) : (
            <Ionicons name="person-circle-outline" size={100} color="#fff" />
          )}
        </TouchableOpacity>
        <Text style={styles.username}>{user.username}</Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Ionicons name="book-outline" size={24} color="#B22222" />
          <Text style={styles.statNumber}>{recipeCount}</Text>
          <Text style={styles.statLabel}>Recipes</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="ribbon-outline" size={24} color="#B22222" />
          <Text style={styles.statNumber}>{badgeDetails.length}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      {/* Badges Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={styles.badgesList}>
          {badgeDetails.map((badge) => (
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
      <View style={styles.tabContent}>
        {activeTab === 'wishlist' ? (
          <ScrollView
            style={styles.scrollableTab}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {wishlistBottles.map((item, idx) => (
              <TouchableOpacity
                key={item._id ?? idx.toString()}
                style={styles.listItem}
                onPress={() => navigation.navigate('Bottle', { id: item._id })}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                <Text style={styles.listText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollableTab}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
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
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f5fa',
  },
  gradientHeader: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -50,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '45%',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  badgeLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 8,
    marginBottom: 8,
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
    backgroundColor: '#B22222',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    marginTop: 16,
    marginHorizontal: 16,
  },
  scrollableTab: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  listText: {
    fontSize: 16,
    color: '#333',
  },
});