import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Public Firebase credentials from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0164177625",
  appId: "1:39664108705:web:f651dc6cfa90769eb99ce0",
  apiKey: "AIzaSyCUIa9FWYslXXax4I2WZIygClp9IkwEbPI",
  authDomain: "gen-lang-client-0164177625.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-4629e8d5-a4c9-4c6d-9e83-3830f858e65d",
  storageBucket: "gen-lang-client-0164177625.firebasestorage.app",
  messagingSenderId: "39664108705"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID from AI Studio
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Default user ID for demonstration/persistence
export const DEFAULT_USER_ID = 'pilot-user-123';
