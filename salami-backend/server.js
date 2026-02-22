require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SAFETY CHECK: Only start Firebase if the key file exists
const keyPath = './serviceAccountKey.json';
let db;
if (fs.existsSync(keyPath)) {
    const serviceAccount = require(keyPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
    console.log("✅ Firebase Connected");
} else {
    console.log("⚠️ Warning: serviceAccountKey.json missing. Database updates won't work, but server will stay running.");
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
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
            desc: "Eid Salami",
            currency: "BDT",
            amount: amount,
            tran_id: `TRX_${Date.now()}`,
            opt_a: boxId,
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

// SUCCESS ROUTE
app.post('/api/payment-success', async (req, res) => {
    const { opt_a, amount, mer_txnid } = req.body;
    try {
        if (db && opt_a) {
            await db.collection('boxes').doc(opt_a).update({ paid: true, salamiAmount: amount });
        }
    } catch (err) { console.log("DB Update Error:", err.message); }
    res.redirect(`${FRONTEND_URL}/payment-success?trxId=${mer_txnid}`);
});

app.post('/api/payment-fail', (req, res) => res.redirect(`${FRONTEND_URL}/payment-fail`));


app.listen(PORT, () => console.log(`🟢 Server is LIVE on port ${PORT}`));