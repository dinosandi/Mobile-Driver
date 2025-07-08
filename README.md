# 🚚 Driver App – E-Commerce Delivery System (React Native)

This is the **Driver App** for the E-Commerce platform, built using **React Native**. The app enables delivery personnel to receive tasks from admin, track assigned deliveries, and communicate in real-time with customers via WebSocket chat.

---

## 📱 Tech Stack

| Technology        | Description                                                  |
|-------------------|--------------------------------------------------------------|
| **React Native**  | Cross-platform mobile development                            |
| **Axios**         | HTTP client for API communication                            |
| **CSS (StyleSheet)** | Styling for native UI elements                            |
| **WebSocket**     | Real-time messaging between driver and customer              |

---

## 🚀 Key Features

### 📦 Delivery Task Notification
- Drivers automatically **receive new delivery assignments** from Admin
- Tasks are **fetched via API** and optionally triggered by **real-time event**
- Assigned deliveries are listed by status: *pending*, *in progress*, *completed*

### 💬 Real-time Chat with Customer (WebSocket)
- Driver can **chat directly with the customer** for coordination
- Chat supports:
  - Real-time updates via WebSocket
  - Order-related discussions (e.g. location, status, etc.)
- Each chat session is scoped per transaction

### ✅ Task Progress Tracking
- Update delivery status: e.g., "On The Way", "Delivered"
- Submit proof of delivery (optional image or confirmation)
- Location sharing (if enabled) to help customer track

---

## 🧭 Screens Overview

- 📋 **Task List**: Shows all assigned deliveries
- 📍 **Task Detail**: Includes order info, address, customer chat
- 💬 **Chat**: Real-time messaging interface
- 🔔 **Notification**: Optional push notification for new assignments

---

![image](https://github.com/user-attachments/assets/28528df6-d6c8-4a18-ad75-b4111a2ae4b6)
