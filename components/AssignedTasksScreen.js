import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import api from '../api/api';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

export default function AssignedTasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { loggedInDriverId } = route.params || {}; // Get loggedInDriverId from params

  const fetchAssignedTasks = useCallback(async () => {
    if (!loggedInDriverId) {
      setLoading(false);
      setError("ID driver tidak ditemukan. Mohon login kembali.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/Transactions'); // Fetch all transactions
      const allTransactions = response.data;

      // Filter transactions for the logged-in driver that are 'Driver Assigned'
      const assignedTasks = allTransactions.filter(
        (transaction) =>
          String(transaction.DriverId) === String(loggedInDriverId) &&
          (transaction.Status === 'Driver Assigned' || transaction.Status === 'Shipped') // Include Shipped for potential completion
      );
      setTasks(assignedTasks);
    } catch (err) {
      console.error("Error fetching assigned tasks:", err);
      if (err.response && err.response.status === 401) {
        setError("Tidak Sah: Sesi berakhir. Silakan login kembali.");
        // Consider clearing AsyncStorage and navigating to login
      } else {
        setError("Gagal memuat tugas. Silakan periksa koneksi Anda.");
      }
    } finally {
      setLoading(false);
    }
  }, [loggedInDriverId]);

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAssignedTasks();
      return () => {}; // Cleanup function
    }, [fetchAssignedTasks])
  );

  const handleUpdateTaskStatus = useCallback(async (transactionId, invoiceNumber, newStatus) => {
    Alert.alert(
      "Konfirmasi Status",
      `Anda yakin ingin mengubah status transaksi ${invoiceNumber} menjadi ${newStatus}?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Konfirmasi",
          onPress: async () => {
            try {
              setLoading(true); // Set loading while updating
              // PERBAIKAN: Mengirim newStatus sebagai string langsung, bukan objek JSON.
              const statusUpdateResponse = await api.put(`/Transactions/${transactionId}/status`,
                JSON.stringify(newStatus), // Mengirim string status
                { headers: { 'Content-Type': 'application/json' } } // Pastikan header Content-Type adalah JSON
              );

              console.log('Status update response:', statusUpdateResponse.data);

              if (statusUpdateResponse.status === 200 || statusUpdateResponse.status === 204) {
                Alert.alert("Berhasil", `Transaksi ${invoiceNumber} berhasil diubah menjadi ${newStatus}!`);
                fetchAssignedTasks(); // Refresh the list after update
              } else {
                Alert.alert("Gagal", `Gagal mengubah status tugas: Respon tidak diharapkan (${statusUpdateResponse.status}).`);
              }

            } catch (err) {
              console.error("Error updating task status:", err);
              if (err.response) {
                console.error("Error response data:", err.response.data);
                console.error("Error response status:", err.response.status);
                console.error("Error response headers:", err.response.headers);
                // Menampilkan pesan kesalahan dari API jika tersedia
                const errorMessage = err.response.data.errors?.status?.[0] || err.response.data.message || 'Terjadi kesalahan server.';
                Alert.alert("Gagal", `Gagal mengubah status tugas: ${errorMessage}`);
              } else if (err.request) {
                console.error("Error request:", err.request);
                Alert.alert("Gagal", "Gagal mengubah status tugas: Tidak ada respon dari server. Periksa koneksi internet Anda.");
              } else {
                console.error("Error message:", err.message);
                Alert.alert("Gagal", `Gagal mengubah status tugas: ${err.message || 'Terjadi kesalahan tidak dikenal.'}`);
              }
            } finally {
              setLoading(false); // Stop loading
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [fetchAssignedTasks]);

  const renderTaskItem = useCallback(({ item }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle}>Invoice: {item.InvoiceNumber}</Text>
      <Text style={styles.taskDetail}>Status: {item.Status}</Text>
      <Text style={styles.taskDetail}>Penerima: {item.RecipientName}</Text>
      <Text style={styles.taskDetail}>Telepon Penerima: {item.RecipientPhone}</Text>
      <Text style={styles.taskDetail}>Alamat Pengiriman: {item.ShippingAddress}, {item.ShippingCity} {item.ShippingPostalCode}</Text>
      <Text style={styles.taskDetail}>Total Jumlah: Rp {item.TotalAmount?.toLocaleString('id-ID')}</Text>

      {/* Detail Toko */}
      {item.Store && (
        <View style={styles.storeInfoContainer}>
          <Text style={styles.storeInfoHeader}>Detail Toko:</Text>
          <Text style={styles.storeInfoText}>Nama Toko: {item.Store.Name}</Text>
          <Text style={styles.storeInfoText}>Email Toko: {item.Store.Email}</Text>
          <Text style={styles.storeInfoText}>Telepon Toko: {item.Store.PhoneNumber}</Text>
          <Text style={styles.storeInfoText}>Alamat Toko: {item.Store.Districts}, {item.Store.Cities}, {item.Store.Provinces}</Text>
          <Text style={styles.storeInfoText}>Jam Operasional: {item.Store.OperationalHours}</Text>
        </View>
      )}

      {item.Items && item.Items.length > 0 && (
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsHeader}>Barang:</Text>
          {item.Items.map((subItem, index) => (
            <Text key={index} style={styles.itemText}>
              - {subItem.ItemType === 'Product' ? subItem.Product?.Name : subItem.Bundle?.Name} ({subItem.Quantity}x)
            </Text>
          ))}
        </View>
      )}

      {/* Tombol untuk SHIPPED dan COMPLETED */}
      <View style={styles.buttonContainer}>
        {item.Status === 'Driver Assigned' && ( // Only show "Kirim" if status is "Driver Assigned"
          <TouchableOpacity
            style={[styles.statusButton, styles.shippedButton]}
            onPress={() => handleUpdateTaskStatus(item.Id, item.InvoiceNumber, 'Shipped')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.statusButtonText}>Kirim (Shipped)</Text>
            )}
          </TouchableOpacity>
        )}

        {item.Status === 'Shipped' && ( // Only show "Selesaikan" if status is "Shipped"
          <TouchableOpacity
            style={[styles.statusButton, styles.completeButton]}
            onPress={() => handleUpdateTaskStatus(item.Id, item.InvoiceNumber, 'Completed')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.statusButtonText}>Selesaikan (Completed)</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [loading, handleUpdateTaskStatus]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Kembali'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tugas Saya</Text>
      </View>

      {loading && !tasks.length ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : tasks.length === 0 ? (
        <Text style={styles.noDataText}>Tidak ada tugas yang ditugaskan kepada Anda saat ini.</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.Id.toString()}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    backgroundColor: '#FFD700',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    padding: 5,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#555',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  taskDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  storeInfoContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  storeInfoHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  storeInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  itemsHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  statusButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  shippedButton: {
    backgroundColor: '#ffc107', // Orange/Yellow for Shipped
  },
  completeButton: {
    backgroundColor: '#28a745', // Green for Completed
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});