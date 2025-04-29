import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002'; // Update for production

const ChatScreen = () => {
    const [messages, setMessages] = useState([]); // history of messages
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        const updatedMessages = [...messages, userMessage]; // 👈 include past messages

        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/api/chat`, { messages: updatedMessages });
            const aiMessage = { role: 'assistant', content: res.data.reply };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error fetching response:', error);
            const errorMessage = { role: 'assistant', content: 'Error getting response from AI.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            <ScrollView
                contentContainerStyle={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((msg, index) => (
                    <View
                        key={index}
                        style={[
                            styles.messageBubble,
                            msg.role === 'user' ? styles.userBubble : styles.aiBubble
                        ]}
                    >
                        <Text style={styles.messageText}>{msg.content}</Text>
                    </View>
                ))}
                {loading && (
                    <ActivityIndicator size="small" color="#B22222" style={{ marginTop: 10 }} />
                )}
            </ScrollView>

            {/* Bottom Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fcf8f5',
    },
    messagesContainer: {
        padding: 15,
        paddingBottom: 90, // to avoid keyboard overlap
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#2E8B57',
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#ccc',
    },
    messageText: {
        color: '#fff',
        fontSize: 16,
    },
    inputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        paddingHorizontal: 15,
        fontSize: 16,
        height: 45,
    },
    sendButton: {
        backgroundColor: '#B22222',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        paddingHorizontal: 20,
        height: 45,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});