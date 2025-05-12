import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
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

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{ headerShown: false }}
          tabBar={(props) => {
            // figure out the active tab name
            const routeName = props.state.routes[props.state.index].name;

            // if we're on Login (or Register) screen, render no bar:
            if (routeName === 'Login' || routeName === 'Register') {
              return null;
            }

            // otherwise render your custom bar
            return <Navbar {...props} />;
          }}
        >
          <Tab.Screen
            name="Login"
            component={LoginScreen}

          />

          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Recommendation" component={RecommendationMain} />
          <Tab.Screen name="Recipes" component={RecipePage} />
          <Tab.Screen name="Chat" component={ChatScreen} />
          <Tab.Screen name="Bottle" component={BottlePage} />
          <Tab.Screen name="Search" component={SearchPage} />
          <Tab.Screen name="Scan" component={ScanScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
          <Tab.Screen name="ProfileSetting" component={ProfileSetting} />
          <Tab.Screen name="UserRecipes" component={UserRecipes} />
        </Tab.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
const styles = StyleSheet.create({
});