import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.trim().length > 0,
);

export const firebaseAuth: Auth | null = isConfigured
  ? getAuth(
      getApps().length > 0 ? getApp() : initializeApp(firebaseConfig),
    )
  : null;

export const googleProvider = new GoogleAuthProvider();
export const isFirebaseAuthConfigured = isConfigured;
