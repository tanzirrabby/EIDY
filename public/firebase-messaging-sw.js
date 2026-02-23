importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// আপনার রিয়েল কনফিগ
const firebaseConfig = {
  apiKey: "AIzaSyAVkmMx7wZjLTccCPWiYgF8bY_RrXMGMg0",
  authDomain: "eid-gift-box.firebaseapp.com",
  projectId: "eid-gift-box",
  storageBucket: "eid-gift-box.firebasestorage.app",
  messagingSenderId: "291121768060",
  appId: "1:291121768060:web:4973646a312f7a9c76cbf9"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || "New Gift!";
  const notificationOptions = {
    body: payload.notification?.body || "You have received a new surprise.",
    icon: '/logo192.png' // public ফোল্ডারে লোগো থাকলে সেটার নাম দিন, নাহলে এটা ডিফল্ট থাক
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});