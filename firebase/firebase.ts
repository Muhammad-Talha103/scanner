import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDmOyxm0yxnGDI1tnwlqn9HP2ZQ1muIzPo",
  authDomain: "scanner-afaf8.firebaseapp.com",
  projectId: "scanner-afaf8",
  storageBucket: "scanner-afaf8.firebasestorage.app",
  messagingSenderId: "280595563761",
  appId: "1:280595563761:web:04bf285ca0d106e00a9550",
  measurementId: "G-5CX9BW2BNL"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);