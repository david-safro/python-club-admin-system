// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyC4MSp_TDdIHLYqMpULxCkBoEyoGNB65tw",
    authDomain: "admin-system-98ee5.firebaseapp.com",
    projectId: "admin-system-98ee5",
    storageBucket: "admin-system-98ee5.appspot.com",
    messagingSenderId: "70797332783",
    appId: "1:70797332783:web:9684df7e42e7a5c9af51da",
    measurementId: "G-ZRSQEVVRH2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);