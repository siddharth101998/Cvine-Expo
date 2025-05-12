import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../authContext/AuthContext';
import axios from 'axios';
import { host } from '../../API-info/apiifno';
import { useNavigation } from '@react-navigation/native';


const ProfileSetting = () => {
    const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [showPassModal, setShowPassModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newUsername, setNewUsername] = useState(user.username || '');

  const handlePasswordSave = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords must match and not be empty.');
      return;
    }
    try {
      const res = await axios.put(`${host}/user/${user._id}`, { password: newPassword });
      updateUser(res.data.data);
      Alert.alert('Success', 'Password updated.');
      setShowPassModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update password.');
    }
  };

  const handleUsernameSave = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    try {
      const res = await axios.put(`${host}/user/${user._id}`, { username: newUsername.trim() });
      updateUser(res.data.data);
      Alert.alert('Success', 'Username updated.');
      setShowUsernameModal(false);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update username.');
    }
  };

  const handleLogout = () => {
    updateUser(null);
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowPassModal(true)}>
          <Ionicons name="lock-closed-outline" size={20} color="#B22222" />
          <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowUsernameModal(true)}>
          <Ionicons name="person-outline" size={20} color="#B22222" />
          <Text style={styles.actionText}>Change Username</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#B22222" />
          <Text style={styles.actionText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Change Password Modal */}
      <Modal transparent animationType="slide" visible={showPassModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="New Password"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Confirm Password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowPassModal(false)} style={styles.modalBtn}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePasswordSave} style={styles.modalBtn}>
                  <Text>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Username Modal */}
      <Modal transparent animationType="slide" visible={showUsernameModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Change Username</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="New Username"
                value={newUsername}
                onChangeText={setNewUsername}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowUsernameModal(false)} style={styles.modalBtn}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUsernameSave} style={styles.modalBtn}>
                  <Text>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default ProfileSetting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f4f5fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonGroup: {
    marginTop: 72,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    marginLeft: 16,
  },
});