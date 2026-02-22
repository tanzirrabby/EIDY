// src/firebase.js
// ─────────────────────────────────────────────────────────
// STEP 1: Go to https://console.firebase.google.com
// STEP 2: Click "Add project" → name it "eid-gift-box"
// STEP 3: Click "Web" icon (</>) to add a web app
// STEP 4: Copy your firebaseConfig values below
// STEP 5: In Firebase console → Build → Firestore Database
//          → Create database → Start in TEST MODE → Done
// STEP 6: In Firebase console → Build → Authentication
//          → Get started → Email/Password → Enable → Save
// ─────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAVkmMx7wZjLTccCPWiYgF8bY_RrXMGMg0",
  authDomain: "eid-gift-box.firebaseapp.com",
  projectId: "eid-gift-box",
  storageBucket: "eid-gift-box.firebasestorage.app",
  messagingSenderId: "291121768060",
  appId: "1:291121768060:web:4973646a312f7a9c76cbf9",
  measurementId: "G-KDYHG740Y7"
};

const app  = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
