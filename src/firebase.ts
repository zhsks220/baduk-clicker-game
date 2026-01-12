import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBpUK6T26n124fBtR3RFFkRNz1Jm_AStKk",
  authDomain: "grow-the-chess.firebaseapp.com",
  projectId: "grow-the-chess",
  storageBucket: "grow-the-chess.firebasestorage.app",
  messagingSenderId: "36581620604",
  appId: "1:36581620604:web:788be5364ea2642ebc82f9",
  measurementId: "G-EH82J8QEPY"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
