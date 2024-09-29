import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDbzAY7U-U0bsXyHKX1cBR5uKLM6funxg4",
    authDomain: "faruqeclypst.firebaseapp.com",
    databaseURL: "https://faruqeclypst-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "faruqeclypst",
    storageBucket: "faruqeclypst.appspot.com",
    messagingSenderId: "206003551783",
    appId: "1:206003551783:web:e76c563a4ffe78adf2d802"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);