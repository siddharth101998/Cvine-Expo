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
import { host } from '../API-info/apiifno';
//const API_BASE_URL = 'http://localhost:5002'; // Update for production

const ChatScreen = () => {
    const [messages, setMessages] = useState([]); // history of messages
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const exampleQuestions = [
        'What wine pairs well with steak?',
        'Tell me about Pinot Noir.',
        'Suggest a wine for a summer picnic.',
    ];
    const sendMessage = async (messageContent = input) => {
        if (!messageContent.trim()) return;

        const userMessage = { role: 'user', content: messageContent };
        const updatedMessages = [...messages, userMessage]; // 👈 include past messages

        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await axios.post(`${host}/api/chat`, { messages: updatedMessages });
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
    const handleExamplePress = (question) => {
        setInput(question);
        sendMessage(question);
    };
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerText}>Wine AI</Text>
            </View>

            {/* Messages */}
            <ScrollView
                contentContainerStyle={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
            >
                {messages.length === 0 && (
                    <View style={styles.exampleContainer}>
                        <Text style={styles.exampleTitle}>Try asking:</Text>
                        {exampleQuestions.map((question, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.exampleButton}
                                onPress={() => handleExamplePress(question)}
                            >
                                <Text style={styles.exampleButtonText}>{question}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                {messages.map((msg, index) => (
                    <View
                        key={index}
                        style={[
                            styles.messageBubble,
                            msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                        ]}
                    >
                        <Text style={styles.messageText}>{msg.content}</Text>
                    </View>
                ))}
                {loading && (
                    <ActivityIndicator size="small" color="#B22222" style={{ marginTop: 10 }} />
                )}
            </ScrollView>

            {/* Input Field */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={input}
                    onChangeText={setInput}
                />
                <TouchableOpacity style={styles.sendButton} onPress={() => sendMessage(input)}>
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
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#B22222',
        alignItems: 'center',
    },
    headerText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    messagesContainer: {
        padding: 15,
        paddingBottom: 90, // To avoid keyboard overlap
    },
    exampleContainer: {
        marginBottom: 20,
    },
    exampleTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    exampleButton: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    exampleButtonText: {
        fontSize: 16,
        color: '#555',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#B22222',
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#B22222',
    },
    messageText: {
        fontSize: 16,
        color: '#fff',
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
        backgroundColor: '#f9f9f9',
        borderRadius: 25,
        paddingHorizontal: 15,
        fontSize: 16,
        height: 45,
        borderWidth: 1,
        borderColor: '#ddd',
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