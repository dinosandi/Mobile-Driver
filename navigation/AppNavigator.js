// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Page from '../components/Page';
import LoginForm from '../components/LoginForm';
import HomeScreen from '../components/HomeScreen';
import DriverListScreen from '../components/DriverListScreen';
import AssignedTasksScreen from '../components/AssignedTasksScreen';
import ChatScreen from '../components/ChatScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Page">
        <Stack.Screen name="Page" component={Page} />
        <Stack.Screen name="Login" component={LoginForm} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AssignedTasks" component={AssignedTasksScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="DriverList" component={DriverListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
