import { StatusBar } from 'expo-status-bar';
import { FlatListComponent, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { handleScan } from './src/Components/Scan';
import LoginScreen from './src/Components/Login';
import RegisterScreen from './src/Components/Register';
import HomeScreen from './src/Components/HomeScreen';
import ScanScreen from './src/Components/Scan';
import BottlePage from './src/Components/BottlePage';
import { TouchableOpacity } from 'react-native';
import RecipePage from './src/Components/Recipe';
import Recommendation from './src/Components/Recommendation';
//import ProfileScreen from './src/Components/Profile'; // make sure this exists
import { AuthProvider } from './src/authContext/AuthContext';
import ChatScreen from './src/Components/Chat';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          height: 90,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Recipes') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Recommendation') iconName = focused ? 'flame' : 'flame-outline';
          return iconName ? <Ionicons name={iconName} size={22} color={color} /> : null;
        },
        tabBarActiveTintColor: '#B22222',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {/* Home tab */}
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Recommendation" component={Recommendation} />

      {/* Center Camera Button */}
      <Tab.Screen
        name="ScanButton"
        component={HomeScreen}
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={{
                position: 'absolute',
                bottom: '80%',
                left: '53%',
                transform: [{ translateX: -30 }],
                width: 50,
                height: 50,
                borderRadius: 30,
                backgroundColor: '#2E8B57',
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
              }}
              onPress={handleScan}
            >
              <Ionicons name="camera" size={25} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <Tab.Screen name="Recipes" component={RecipePage} />
      <Tab.Screen name="Chat" component={ChatScreen} />

      {/* ✅ Add Bottle Page Hidden in Tabs */}
      <Tab.Screen
        name="Bottle"
        component={BottlePage}
        options={{
          tabBarButton: () => null,


        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Login and Register - no tabs */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />

          {/* This one has the tab bar! */}
          <Stack.Screen name="Main" component={MainTabs} />

          {/* Additional pages without tabs */}
          <Stack.Screen name="Bottle" component={BottlePage} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
const styles = StyleSheet.create({
});