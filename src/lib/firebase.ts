import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import config from "../../firebase-applet-config.json";

// Firebase configuration for the application
export const firebaseConfig = {
  apiKey: config.apiKey || (import.meta as any).env?.VITE_FIREBASE_API_KEY || "REPLACE_WITH_YOUR_API_KEY",
  authDomain: config.authDomain || (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: config.projectId || (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: config.storageBucket || (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: config.messagingSenderId || (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: config.appId || (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
