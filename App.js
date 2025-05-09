import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { handleScan } from './src/Components/Scan';
import LoginScreen from './src/Components/Login';
import RegisterScreen from './src/Components/Register';
import HomeScreen from './src/Components/HomeScreen';
import ScanScreen from './src/Components/Scan';
import BottlePage from './src/Components/BottlePage';
import UserRecipes from './src/Components/UserRecipes';
import RecipePage from './src/Components/Recipe';
import Recommendation from './src/Components/Recommendation';
import { AuthProvider } from './src/authContext/AuthContext';
import ChatScreen from './src/Components/Chat';
import SearchPage from './src/Components/SearchPage';
import Navbar from './src/Components/NavbarTabs';
import ProfileScreen from './src/Components/Profile/Profile_Screen';
import RecommendationMain from './src/Components/Recommendation/Recommendation';
import ProfileSetting from './src/Components/Profile/ProfileSetting';
const Stack = createNativeStackNavigator();

function ScreenWithNavbar({ children }) {
  return (
    <>
      {children}
      <Navbar />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {/* Login and Register screens without the navbar */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />

          {/* Screens with navbar */}
          <Stack.Screen name="Home" options={{ headerShown: false }}>
            {() => <ScreenWithNavbar><HomeScreen /></ScreenWithNavbar>}
          </Stack.Screen>
          <Stack.Screen name="Recommendation" options={{ headerShown: false }}>
            {() => <ScreenWithNavbar><RecommendationMain /></ScreenWithNavbar>}
          </Stack.Screen>
          <Stack.Screen name="Recipes" options={{ headerShown: false }}>
            {() => <ScreenWithNavbar><RecipePage /></ScreenWithNavbar>}
          </Stack.Screen>
          <Stack.Screen name="Chat" options={{ headerShown: false }}>
            {() => <ScreenWithNavbar><ChatScreen /></ScreenWithNavbar>}
          </Stack.Screen>
          <Stack.Screen name="Bottle" options={{ headerShown: false }}>
            {() => <ScreenWithNavbar><BottlePage /></ScreenWithNavbar>}
          </Stack.Screen>
          <Stack.Screen name="Search" options={{ headerShown: false }}>
            {() => <ScreenWithNavbar><SearchPage /></ScreenWithNavbar>}
          </Stack.Screen>
          <Stack.Screen name="UserRecipes" options={{ headerShown: false }}>
            {() => <ScreenWithNavbar><UserRecipes /></ScreenWithNavbar>}
          </Stack.Screen>
          <Stack.Screen name="Profile" options={{ headerShown: false }}>
            {() => (<ScreenWithNavbar><ProfileScreen /></ScreenWithNavbar>)}
          </Stack.Screen>
          <Stack.Screen name="Scan" options={{ headerShown: false }}>
            {() => (<ScreenWithNavbar><ScanScreen /></ScreenWithNavbar>)}
          </Stack.Screen>
          <Stack.Screen name="ProfileSetting" options={{ headerShown: false }}>
            {() => (<ScreenWithNavbar><ProfileSetting /></ScreenWithNavbar>)}
          </Stack.Screen>
          </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
const styles = StyleSheet.create({
});