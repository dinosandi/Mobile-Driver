import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import api from '../api/api';
import { useRoute } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';

export default function ChatScreen() {
  const route = useRoute();
  const { senderId, receiverId, receiverName } = route.params;

  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headerHeight = useHeaderHeight();
  const scrollViewRef = useRef();

  const fetchChatMessages = useCallback(async () => {
    if (!senderId || !receiverId) {
      console.warn('SenderId atau ReceiverId tidak ada untuk mengambil pesan.');
      return;
    }

    setLoading(true);
    setError(null);
   try {
  const response = await api.get('/Chat/messages', {
    params: { userId: senderId },
  });

  const allFetchedMessages = Array.isArray(response.data) ? response.data : [];

  console.log("✅ Data dari API:", allFetchedMessages);
  console.log("✅ senderId:", senderId);
  console.log("✅ receiverId:", receiverId);

  const filteredMessages = allFetchedMessages
    .filter(msg =>
      (msg.SenderId === senderId && msg.ReceiverId === receiverId) ||
      (msg.SenderId === receiverId && msg.ReceiverId === senderId)
    )
    .map(msg => ({
      id: msg.Id,
      SenderId: msg.SenderId,
      ReceiverId: msg.ReceiverId,
      Message: msg.Message,
      timestamp: msg.Timestamp
        ? new Date(msg.Timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'N/A',
      rawTimestamp: msg.Timestamp ? new Date(msg.Timestamp) : new Date(0),
    }));

  // Urutkan berdasarkan waktu
  filteredMessages.sort((a, b) => a.rawTimestamp - b.rawTimestamp);

  console.log("✅ Filtered Messages:", filteredMessages);

  // ✅ Update state
  setChatMessages(filteredMessages);
} catch (err) {
  console.error('❌ Gagal memuat pesan:', err);
  setError('Gagal memuat pesan.');
}
finally {
      setLoading(false);
    }
  }, [senderId, receiverId]);

  useEffect(() => {
    fetchChatMessages();
  }, [fetchChatMessages]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Pesan tidak boleh kosong.');
      return;
    }

    if (!senderId || !receiverId) {
      Alert.alert('Error', 'ID Pengirim atau Penerima tidak ada. Silakan login kembali.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const chatPayload = {
        SenderId: senderId,
        ReceiverId: receiverId,
        Message: message.trim(),
      };
      console.log('Mengirim payload chat:', chatPayload);

      const response = await api.post('/Chat', chatPayload);
      console.log('Respons pengiriman chat:', response.data.data);

      setChatMessages(prevMessages => [
        ...prevMessages,
        {
          id: response.data.Id || Date.now().toString(),
          SenderId: senderId,
          ReceiverId: receiverId,
          Message: message.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTimestamp: new Date()
        }
      ]);
      setMessage('');
    } catch (err) {
      console.error('Error mengirim pesan:', err);
      Alert.alert('Error', 'Gagal mengirim pesan. Coba lagi.');
      setError('Gagal mengirim pesan.');
    } finally {
      setLoading(false);
    }
  };
console.log({chatMessages})
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight + 20 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat dengan {receiverName || 'Pelanggan'}</Text> 
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
      >
        {loading && chatMessages.length === 0 ? (
          <ActivityIndicator size="large" color="#007bff" style={styles.loadingIndicator} />
        ) : error && chatMessages.length === 0 ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : chatMessages.length === 0 ? (
          <Text style={styles.noMessagesText}>Mulai mengobrol untuk melihat pesan di sini!</Text>
        ) : (
          chatMessages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                String(msg.SenderId) === String(senderId) ? styles.myMessage : styles.otherMessage,
              ]}
            >
              <Text style={styles.messageText}>{msg.Message}</Text>
              <Text style={styles.messageTime}>{msg.timestamp}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Ketik pesan Anda..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={loading}
        >
          <Text style={styles.sendButtonText}>Kirim</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 10,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
    borderBottomRightRadius: 2,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 50 : 140,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  noMessagesText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontSize: 16,
  }
});