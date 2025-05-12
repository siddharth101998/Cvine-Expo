// src/Components/Profile/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Animated, FlatList, Dimensions, TouchableOpacity } from 'react-native';
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = SCREEN_WIDTH / 2 - 24;
const ITEM_HEIGHT = ITEM_WIDTH * 1.6;
const formatDate = iso => {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
};

import { useAuth } from '../../authContext/AuthContext';
import { useState, useEffect, } from 'react';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
      // Sort wishlist so newest additions appear first
      const sorted = Array.isArray(res.data.bottles)
        ? res.data.bottles.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      setWishlistBottles(sorted);
    } catch (error) {
      console.error("Error fetching wishlist bottles:", error);
    }
  };

  const handleBottleClick = (bottleId) => {
    navigation.navigate("Bottle", { id: bottleId });
    console.log("Bottle selected:", bottleId);
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
      const res = await axios.get(`${host}/recipe/count/${user._id}`);
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
      console.log("searchhistory response:", res.data[0]);

      // Sort search history so newest items appear first
      const sortedHistory = res.data.sort((a, b) => {
        const dateA = new Date(b.createdAt || b.createdat);
        const dateB = new Date(a.createdAt || a.createdat);
        return dateA - dateB;
      });
      setSearchHistory(sortedHistory);
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
  useFocusEffect(
    React.useCallback(() => {
      //console.log("aaagvsucbvjshfbwjhcbskhbvsdjkcscgbhsjkvcbsjcskuvch-------------")
      fetchRecipeCount();
      fetchWishlist();
      fetchSearchHistory();
    }, [])
  )

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
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#B22222', '#FF6347']}
        style={styles.gradientHeader}
      >
        {/* Profile Settings */}
        <TouchableOpacity style={styles.settingsIcon} onPress={() => navigation.navigate('ProfileSetting')}>
          <Ionicons name="settings-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
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
          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statBox}
              onPress={() => navigation.navigate('UserRecipes', { userId: user._id })}
            >
              <Ionicons name="restaurant-outline" size={24} color="#fff" />
              <Text style={styles.statNumber}>{recipeCount}</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </TouchableOpacity>
            <View style={styles.statBox}>
              <Ionicons name="ribbon-outline" size={24} color="#fff" />
              <Text style={styles.statNumber}>{badgeDetails.length}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
      {/* Fixed Badges Section
  <View style={styles.section}>
      <Text style={styles.sectionTitle}>Badges</Text>
      <View style={styles.badgesList}>
        {badgeDetails.map((badge) => (
          <Image key={badge._id} source={{ uri: badge.badgeLogo }} style={styles.badgeLogo} />
        ))}
      </View>
    </View> */}

      {/* Fixed Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wishlist' && styles.activeTab]}
          onPress={() => setActiveTab('wishlist')}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>Wishlist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>Search History</Text>
        </TouchableOpacity>
      </View>

      {/* Only Scroll This Area */}
      <View style={styles.listWrapper}>
        <FlatList
          data={activeTab === 'wishlist' ? wishlistBottles : searchHistory}
          inverted
          horizontal
          pagingEnabled
          snapToInterval={ITEM_WIDTH + 24}
          decelerationRate="fast"
          keyExtractor={(item, idx) => item._id || idx.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => {
            // Determine name and timestamp fields
            const name = activeTab === 'wishlist'
              ? item.name
              : item.bottle?.name || item.name;

            // Use Mongoose timestamps (createdAt), fallback to legacy field
            const date = item.createdAt || item.createdat;
            return (
              <TouchableOpacity onPress={() => activeTab === 'wishlist' ? handleBottleClick(item._id) : handleBottleClick(item.bottle._id)}>
                <View style={styles.cardItem}>
                  <Image
                    source={{ uri: item.imageUrl || item.bottle?.imageUrl }}
                    style={styles.cardImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.listText} numberOfLines={2}>{name}</Text>
                  {activeTab === 'search' && date && (
                    <Text style={styles.timeText}>{formatDate(date)}</Text>
                  )}
                </View>
              </TouchableOpacity>


            );
          }}
        />
      </View>


    </View>
  );

};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fcf8f5',

  },
  gradientHeader: {
    height: 235,
    justifyContent: 'center',
    backgroundColor: '#B22222',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  settingsIcon: {
    position: 'absolute',
    top: 60,
    right: 16,
  },
  avatarContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 0,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 8,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 0,
    width: '60%',
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 12,
    width: '45%',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
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
  scrollableContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    marginBottom: 8,
  },
  listText: {
    fontSize: 16,
    textAlign: 'center',
  },
  listWrapper: {
    marginTop: 50,
    paddingVertical: 16,
  },
  horizontalList: {
    paddingLeft: 16,
  },
  cardItem: {
    width: ITEM_WIDTH,
    marginRight: 24,
    alignItems: 'center',
    minHeight: ITEM_HEIGHT + 60,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});