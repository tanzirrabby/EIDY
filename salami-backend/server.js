require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- PRODUCTION FIREBASE INITIALIZATION ---
let db;
try {
    // If running on Vercel, it uses the Environment Variable string
    // If running locally, it looks for the file
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
        : require('./serviceAccountKey.json');

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    db = admin.firestore();
    console.log("✅ Firebase Connected");
} catch (error) {
    console.log("⚠️ Firebase Warning: No valid service account found. DB updates will fail.");
}

// --- URL CONFIGURATION ---
// --- URL CONFIGURATION ---
// Vercel-এর জন্য এখানে লাইভ লিংকগুলো বসাতে হবে, localhost নয়!
const FRONTEND_URL = process.env.FRONTEND_URL || "https://eidy-tanzir.vercel.app";
const BACKEND_URL = process.env.BACKEND_URL || "https://eidy-tanzir.vercel.app";
const PORT = process.env.PORT || 5000;

// INITIATE PAYMENT
app.post('/api/init-payment', async (req, res) => {
    try {
        const { amount, senderName, boxId } = req.body;
        const paymentData = {
            store_id: "aamarpaytest",
            signature_key: "dbb74894e82415a2f7ff0ec3a97e4183",
            cus_name: senderName || "Guest",
            cus_email: "test@test.com",
            cus_phone: "01700000000",
            desc: `Eid Salami for Box ${boxId}`,
            currency: "BDT",
            amount: amount,
            tran_id: `TRX_${Date.now()}`,
            opt_a: boxId, // Storing boxId here so it returns in the success webhook
            success_url: `${BACKEND_URL}/api/payment-success`,
            fail_url: `${BACKEND_URL}/api/payment-fail`,
            cancel_url: `${BACKEND_URL}/api/payment-cancel`,
            type: "json"
        };
        const { data } = await axios.post('https://sandbox.aamarpay.com/jsonpost.php', paymentData);
        res.json({ url: data.payment_url });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 🔔 SUCCESS ROUTE & PUSH NOTIFICATION
app.post('/api/payment-success', async (req, res) => {
    const { opt_a, amount, mer_txnid, cus_name } = req.body;
    
    try {
        if (db && opt_a) {
            // ১. ডাটাবেসে বক্স আপডেট করা
            await db.collection('boxes').doc(opt_a).update({ 
                paid: true, 
                salamiAmount: amount,
                trxId: mer_txnid 
            });
            console.log(`✅ Box ${opt_a} updated in DB.`);

            // ২. বক্সের রিসিভার কে, সেটা ডাটাবেস থেকে খুঁজে বের করা
            const boxDoc = await db.collection('boxes').doc(opt_a).get();
            
            if (boxDoc.exists) {
                const boxData = boxDoc.data();
                // যার কাছে বক্স যাচ্ছে (বক্সের মালিক)
                const receiverUsername = boxData.to; 
                // যে টাকা পাঠিয়েছে
                const senderName = cus_name || boxData.from || "Someone";

                // ৩. রিসিভারের username দিয়ে users কালেকশন থেকে তার fcmToken খোঁজা
                const usersRef = db.collection('users');
                const userQuery = await usersRef.where('username', '==', receiverUsername).get();
                
                if (!userQuery.empty) {
                    const userDoc = userQuery.docs[0];
                    const fcmToken = userDoc.data().fcmToken;

                    // ৪. টোকেন থাকলে তার মোবাইলে/ব্রাউজারে নোটিফিকেশন পাঠানো
                    if (fcmToken) {
                        const message = {
                            notification: {
                                title: "🎁 New Eid Salami!",
                                body: `${senderName} just sent you ${amount} BDT. Check your Gift Box inbox!`
                            },
                            token: fcmToken
                        };
                        
                        // Firebase Admin-এর মাধ্যমে পুশ নোটিফিকেশন সেন্ড
                        await admin.messaging().send(message);
                        console.log(`🔔 Notification sent successfully to ${receiverUsername}`);
                    } else {
                        console.log(`⚠️ No FCM token found for user ${receiverUsername}`);
                    }
                }
            }
        }
    } catch (err) { 
        console.log("❌ DB/Notification Error:", err.message); 
    }
    
    // ৫. সবশেষে ইউজারকে পেমেন্ট সাকসেস পেইজে রিডাইরেক্ট করে দেওয়া
    res.redirect(`${FRONTEND_URL}/payment-success?trxId=${mer_txnid}&amount=${amount}`);
});

// FAIL ROUTE
app.post('/api/payment-fail', (req, res) => {
    res.redirect(`${FRONTEND_URL}/payment-fail`);
});

// CANCEL ROUTE
app.post('/api/payment-cancel', (req, res) => {
    res.redirect(`${FRONTEND_URL}/`);
});

// Export for Vercel
module.exports = app;

// Only listen if running locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🟢 Server is LIVE on port ${PORT}`));
}