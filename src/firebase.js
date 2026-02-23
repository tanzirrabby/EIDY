import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken } from "firebase/messaging"; // ✅ NEW IMPORT

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
export const messaging = getMessaging(app); // ✅ NEW: Messaging init

// ✅ NEW: Token request function
export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, { 
      // 🔥 Firebase Console থেকে পাওয়া VAPID Key এখানে বসান
      vapidKey: "BBPcHaM4-8Nx9uSs9lY2aW5UsXwcrrrzjt4Eaj0OZHSc-7vxb6AjamQPzpgeNNJ77Mhj9hDl6qfuBApKgM9QZw0" 
    });
    
    if (currentToken) {
      console.log("FCM Token: ", currentToken);
      return currentToken;
    } else {
      console.log("No registration token available. User denied permission.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token. ", err);
    return null;
  }
};

export default app;