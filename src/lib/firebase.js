import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdNoGRD_nN4-euVROxm7owlUvTOBklbso",
  authDomain: "d-viewer-d2718.firebaseapp.com",
  projectId: "d-viewer-d2718",
  storageBucket: "d-viewer-d2718.firebasestorage.app",
  messagingSenderId: "812635756378",
  appId: "1:812635756378:web:21a2f8138cb2df5e960563",
  measurementId: "G-WFLQGB0H3T"
};

let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase config is incomplete. Falling back to mock auth state until configured.");
}

export { auth, db };
