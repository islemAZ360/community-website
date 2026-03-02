import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDAx3_N8gZYSmBhzEPUIfnIgwZMzPLQGK0",
    authDomain: "interview-coder-f895b.firebaseapp.com",
    databaseURL: "https://interview-coder-f895b-default-rtdb.firebaseio.com",
    projectId: "interview-coder-f895b",
    storageBucket: "interview-coder-f895b.firebasestorage.app",
    messagingSenderId: "119848230297",
    appId: "1:119848230297:web:cc4672eee21179317b8708",
    measurementId: "G-YLL76252LN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
