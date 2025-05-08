import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../authContext/AuthContext';
import axios from 'axios';
import { host } from '../../API-info/apiifno';
import { useNavigation } from '@react-navigation/native';

const ProfileSetting = () => {
    const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [profileImageUri, setProfileImageUri] = useState(user.profileImage || null);
  const [name, setName] = useState(user.username || '');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.uri ?? result.assets?.[0]?.uri;
      setProfileImageUri(uri);
    }
  };

  const handleSave = async () => {
    if (password && password !== retypePassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const payload = {
        username: name,
        profileImage: profileImageUri,
        ...(password && { password }),
      };
      console.log('Payload to update:', payload);
      // Update user on the backend
      const res = await axios.put(`${host}/user/${user._id}`, payload);
      console.log('User updated:', res.data);

      // Update user in context
      updateUser(res.data);

      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      {/* Profile Picture */}
      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        {profileImageUri ? (
          <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
        ) : (
          <Ionicons name="person-circle-outline" size={100} color="#B22222" />
        )}
      </TouchableOpacity>
      <Text style={styles.label}>Tap to change profile picture</Text>

      {/* Name Input */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Retype Password"
        secureTextEntry
        value={retypePassword}
        onChangeText={setRetypePassword}
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileSetting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f5fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#B22222',
  },
  label: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#B22222',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});