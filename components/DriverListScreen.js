import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import api from '../api/api';
import { useNavigation, useRoute } from '@react-navigation/native'; // Import useRoute

export default function DriverListScreen() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const route = useRoute(); // Use useRoute hook to access params
  const { transactionId, transactionInvoice } = route.params || {}; // Get transactionId and transactionInvoice from params

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/Drivers');
      setDrivers(response.data);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      if (err.response && err.response.status === 401) {
        setError("Unauthorized: Session expired. Please log in again.");
      } else {
        setError("Failed to load drivers. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to assign a driver to the transaction
  const assignDriverToTransaction = useCallback(async (driverId, driverName) => {
    if (!transactionId) {
      Alert.alert("Error", "ID Transaksi tidak ditemukan untuk penugasan.");
      return;
    }

    Alert.alert(
      "Konfirmasi Penugasan",
      `Anda yakin ingin menugaskan ${driverName} untuk Transaksi: ${transactionInvoice}?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Tugaskan",
          onPress: async () => {
            try {
              setLoading(true);
              // Assuming PATCH /api/Transactions/{id} to update fields
              // And assuming Status needs to be updated to 'Driver Assigned'
              await api.patch(`/Transactions/${transactionId}`, {
                DriverId: driverId,
                Status: 'Driver Assigned' // Or whatever status indicates successful assignment
              });
              Alert.alert("Berhasil", `${driverName} berhasil ditugaskan ke Transaksi ${transactionInvoice}!`);
              navigation.goBack(); // Go back to HomeScreen which will then refresh
            } catch (err) {
              console.error("Error assigning driver:", err.response ? err.response.data : err.message);
              Alert.alert("Gagal", `Gagal menugaskan driver: ${err.response?.data?.message || err.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [transactionId, transactionInvoice, navigation]);


  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const renderDriverItem = ({ item }) => (
    <View style={styles.driverCard}>
      <Text style={styles.driverName}>{item.Name || 'Nama Tidak Tersedia'}</Text>
      <Text style={styles.driverDetail}>Email: {item.Email || 'Tidak Tersedia'}</Text>
      <Text style={styles.driverDetail}>Telepon: {item.PhoneNumber || 'Tidak Tersedia'}</Text>
      <Text style={styles.driverDetail}>Lisensi: {item.LicenseNumber || 'Tidak Tersedia'}</Text>
      <TouchableOpacity
        style={styles.assignButton}
        onPress={() => assignDriverToTransaction(item.Id, item.Name)}
        disabled={loading} // Disable button while assigning
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.assignButtonText}>Tugaskan</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Kembali'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Tugaskan Driver {'\n'}untuk Transaksi {transactionInvoice || '...'}{' '}
        </Text>
      </View>

      {loading && !drivers.length ? ( // Show loader only if initial load
        <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : drivers.length === 0 ? (
        <Text style={styles.noDataText}>Tidak ada data driver yang ditemukan.</Text>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(item) => item.Id.toString()}
          renderItem={renderDriverItem}
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
    paddingTop: 50, // Adjust for status bar
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
    zIndex: 1, // Ensure it's above other elements
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1, // Allow title to take up space
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
  driverCard: {
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
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  driverDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  assignButton: {
    backgroundColor: '#007bff', // Blue color for assign button
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});