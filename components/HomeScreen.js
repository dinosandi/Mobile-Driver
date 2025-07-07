import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  FlatList, // Import FlatList for listing customers
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../api/api";

// Import assets
import chatIcon from "../assets/chat.jpg";
import headerBg from "../assets/bg1.jpg";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [userName, setUserName] = useState("Pengguna");
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [actualDriverId, setActualDriverId] = useState(null);
  const [customersForChat, setCustomersForChat] = useState([]); // State to hold filtered customers for chat selection
  const [showCustomerList, setShowCustomerList] = useState(false); // State to control visibility of customer list

  const navigation = useNavigation();

  const loadUserData = useCallback(async () => {
    try {
      const storedUserName = await AsyncStorage.getItem("userName");
      const storedUserId = await AsyncStorage.getItem("loggedInDriverId"); // Assuming this stores the UserId for the logged-in driver
      const storedToken = await AsyncStorage.getItem("userToken");

      if (storedUserName) setUserName(storedUserName);
      if (storedUserId) setLoggedInUserId(storedUserId);
      if (!storedToken) console.warn("Token tidak ditemukan");
    } catch (e) {
      console.error("Error loading user data", e);
      Alert.alert("Error", "Gagal memuat data pengguna.");
    }
  }, []);

  const fetchDriverIdAndTransactions = useCallback(async () => {
    if (!loggedInUserId) return;

    try {
      setLoading(true);
      setError(null);

      const driversResponse = await api.get("/Drivers");
      const allDrivers = driversResponse.data.Data;

      const foundDriver = allDrivers.find(
        (driver) => String(driver.UserId) === String(loggedInUserId)
      );

      if (!foundDriver) {
        setError("Driver tidak ditemukan.");
        return;
      }

      setActualDriverId(foundDriver.Id);

      const transactionsResponse = await api.get("/Transactions");
      // Ensure transactionsResponse.data is an array before filtering
      const allFetchedTransactions = Array.isArray(transactionsResponse.data)
        ? transactionsResponse.data
        : [];

      const driverSpecificTransactions = allFetchedTransactions.filter(
        (transaction) => String(transaction.DriverId) === String(foundDriver.Id)
      );

      setTransactions(driverSpecificTransactions);
    } catch (err) {
      console.error("Error fetching driver ID or transactions:", err);
      if (err.response?.status === 401) {
        setError("Sesi Anda berakhir. Silakan login kembali.");
      } else {
        setError("Gagal memuat data. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }, [loggedInUserId]);

  const handleChatIconPress = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/Customer/profile");
      const allCustomers = response.data || [];
      const filteredCustomers = allCustomers.filter(
        (customer) => customer.Role === 0
      );
      setCustomersForChat(filteredCustomers);

      if (filteredCustomers.length > 0) {
        setShowCustomerList(true);
      } else {
        Alert.alert("No Customers", "No customers with Role 0 found for chat.");
      }
    } catch (error) {
      console.error("Error fetching customer profiles:", error);
      Alert.alert("Error", "Failed to load customer profiles for chat.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomerForChat = async (customer) => {
    if (!loggedInUserId) {
      Alert.alert(
        "Error",
        "Your user ID is not available. Please try logging in again."
      );
      return;
    }

    try {
      const response = await api.get("/Customer/profile");
      const allCustomers = response.data;

      // Temukan profile yang sesuai dengan user login
      const currentUserProfile = allCustomers.find(
        (item) => item.UserId === loggedInUserId
      );

      if (!currentUserProfile || !currentUserProfile.Id) {
        Alert.alert(
          "Error",
          "Profil pengguna tidak ditemukan atau belum lengkap."
        );
        return;
      }

      // Navigasi ke halaman Chat dengan ID yang sesuai
      navigation.navigate("Chat", {
        senderId: currentUserProfile.Id,
        receiverId: customer.Id,
        receiverName: customer.FullName,
      });
    } catch (error) {
      console.error("Gagal mendapatkan data profil customer:", error);
      Alert.alert("Error", "Gagal memuat data profil. Coba lagi nanti.");
    }
  };

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useFocusEffect(
    useCallback(() => {
      if (loggedInUserId !== null) {
        fetchDriverIdAndTransactions();
      }
    }, [loggedInUserId, fetchDriverIdAndTransactions])
  );

  const newAssignmentCount = transactions.filter(
    (t) => t.Status === "Driver Assigned"
  ).length;
  const handoverCount = transactions.filter(
    (t) => t.Status === "Completed" || t.Status === "Shipped"
  ).length;
  const assignmentHistoryCount = transactions.length;

  const handleViewMyAssignedTasks = () => {
    if (actualDriverId) {
      navigation.navigate("AssignedTasks", {
        loggedInDriverId: actualDriverId,
      });
    } else {
      Alert.alert("Info", "Mohon login atau tunggu data driver dimuat.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin logout?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Ya",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              "userToken",
              "userName",
              "loggedInDriverId",
            ]);
            navigation.navigate("Login");
          } catch (e) {
            console.error("Logout error:", e);
            Alert.alert("Error", "Gagal logout.");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        source={headerBg}
        style={styles.headerBackground}
        imageStyle={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.helloText}>Hello,</Text>
          <Text style={styles.driverName}>{userName}</Text>
          <Text style={styles.welcomeText}>Welcome to Driver Mobile App</Text>
        </View>

        {/* Chat icon */}
        <TouchableOpacity
          onPress={handleChatIconPress} // Call the new function here
          style={styles.chatIconButton}
        >
          <Image source={chatIcon} style={styles.chatIconImage} />
        </TouchableOpacity>
      </ImageBackground>

      {/* Logout button moved here */}
      <TouchableOpacity
        style={styles.logoutButtonAboveCard}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{assignmentHistoryCount}</Text>
          <Text style={styles.statLabel}>Assignment History</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { flexDirection: "row", alignItems: "center" },
          ]}
        >
          <View style={styles.prestigeIconPlaceholder}>
            <Text style={styles.prestigeIconText}>💎</Text>
          </View>
          <Text style={styles.statLabel}>Prestige</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search something..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={styles.loadingIndicator}
        />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          {showCustomerList ? (
            <View style={styles.customerListContainer}>
              <Text style={styles.customerListTitle}>
                Select Customer to Chat:
              </Text>
              <FlatList
                data={customersForChat}
                keyExtractor={(item) => item.Id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.customerListItem}
                    onPress={() => handleSelectCustomerForChat(item)}
                  >
                    <Text style={styles.customerListName}>{item.FullName}</Text>
                    <Text style={styles.customerListEmail}>{item.Email}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noCustomersText}>
                    No customers with Role 0 found.
                  </Text>
                }
              />
              <TouchableOpacity
                style={styles.closeCustomerListButton}
                onPress={() => setShowCustomerList(false)}
              >
                <Text style={styles.closeCustomerListButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.assignmentCardsContainer}>
              <View style={styles.assignmentCard}>
                <View style={styles.cardIconPlaceholder}>
                  <Text style={styles.cardIconText}>📝</Text>
                </View>
                <Text style={styles.cardTitle}>New Assignment</Text>
                <Text style={styles.cardCount}>{newAssignmentCount}</Text>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={handleViewMyAssignedTasks}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.assignmentCard}>
                <View style={styles.cardIconPlaceholder}>
                  <Text style={styles.cardIconText}>🤝</Text>
                </View>
                <Text style={styles.cardTitle}>Handover</Text>
                <Text style={styles.cardCount}>{handoverCount}</Text>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f0f0" },
  headerBackground: {
    height: 200,
    paddingHorizontal: 20,
    paddingTop: 40,
    justifyContent: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },
  headerContent: { marginTop: 20 },
  helloText: { fontSize: 24, color: "#000" },
  driverName: { fontSize: 32, fontWeight: "bold", color: "#fff", marginTop: 5 },
  welcomeText: { fontSize: 16, color: "#000", marginTop: 5 },
  // Removed logoutButton from here as it's moved
  chatIconButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 30,
    elevation: 4,
  },
  chatIconImage: { width: 34, height: 34, resizeMode: "contain" },

  // New style for logout button above stats card
  logoutButtonAboveCard: {
    backgroundColor: "#dc3545", // A red color for logout
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: "center", // Center it horizontally
    marginTop: 20, // Space from header
    marginBottom: 20, // Space before stats container
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: -30, // Pull it up to overlap the headerBg a bit
    paddingHorizontal: 10,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    width: width / 2 - 30,
    shadowColor: "#000",
    elevation: 3,
    marginHorizontal: 5,
  },
  statNumber: { fontSize: 30, fontWeight: "bold", color: "#333" },
  statLabel: { fontSize: 14, color: "#555", marginTop: 5, textAlign: "center" },
  prestigeIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#add8e6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  prestigeIconText: { fontSize: 20 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 15,
    elevation: 3,
  },
  searchInput: { flex: 1, height: 50, fontSize: 16, color: "#333" },
  searchIcon: { fontSize: 20, color: "#999", marginLeft: 10 },
  assignmentCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 10,
    marginTop: 20,
  },
  assignmentCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    width: width / 2 - 30,
    marginBottom: 20,
    elevation: 3,
  },
  cardIconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f8ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardIconText: { fontSize: 30 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
  },
  cardCount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 10,
  },
  viewButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  viewButtonText: { fontSize: 14, color: "#333", fontWeight: "bold" },
  loadingIndicator: { marginTop: 50 },
  errorText: { color: "red", textAlign: "center", marginTop: 50, fontSize: 16 },

  // Styles for customer list
  customerListContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    maxHeight: 300, // Limit height for scrollability
  },
  customerListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  customerListItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  customerListName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  customerListEmail: {
    fontSize: 14,
    color: "#777",
  },
  noCustomersText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
  closeCustomerListButton: {
    backgroundColor: "#eee",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
  },
  closeCustomerListButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
});
