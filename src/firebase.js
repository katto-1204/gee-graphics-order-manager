import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDvV7z-AlWOwaLKcZjU1Ks5q5XGpZpnIuc",
  authDomain: "geegraphics-b496f.firebaseapp.com",
  projectId: "geegraphics-b496f",
  storageBucket: "geegraphics-b496f.firebasestorage.app",
  messagingSenderId: "264001283303",
  appId: "1:264001283303:web:84ccc0b0778e3c25732e42",
  measurementId: "G-YS9SER20JJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);