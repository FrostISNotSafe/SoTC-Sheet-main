// Import only the Firebase services we need
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmvVbhmoBN_V64_l72iOPfAFgWfOVe8zc",
  authDomain: "stars-of-the-city-ttrpg.firebaseapp.com",
  databaseURL: "https://stars-of-the-city-ttrpg-default-rtdb.firebaseio.com",
  projectId: "stars-of-the-city-ttrpg",
  storageBucket: "stars-of-the-city-ttrpg.appspot.com",
  messagingSenderId: "9824238094",
  appId: "1:9824238094:web:9ebea2d03ebb410bafda5f",
  measurementId: "G-HXN7JZ01WE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export only the database (no authentication)
export const database = getDatabase(app);
export default app;
