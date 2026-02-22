import React, { useState } from 'react';
import axios from 'axios';

const GOLD = "#D4AF37";

const PaymentComponent = ({ boxId, senderName }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (!amount || amount < 10) {
            alert("Please enter at least 10 TK");
            return;
        }
        setLoading(true);
        try {
            // This calls your Node.js backend
           
// ✅ NEW WAY
const response = await axios.post('/api/init-payment', {
    amount: amount,
    boxId: boxId,
    senderName: senderName,
});

            if (response.data.url) {
                window.location.href = response.data.url; // Redirects to aamarPay
            }
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Payment failed to initialize.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: "20px", background: "rgba(255,255,255,0.05)", 
            borderRadius: "15px", border: `1px solid ${GOLD}44`, textAlign: "center"
        }}>
            <h4 style={{ color: GOLD, marginBottom: "15px", fontFamily: "'Cinzel', serif" }}>Send Real Salami</h4>
            <input 
                type="number" 
                placeholder="Amount (TK)" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                    padding: "10px", borderRadius: "8px", border: "1px solid #444",
                    background: "#111", color: "white", width: "80%", marginBottom: "15px"
                }}
            />
            <button 
                onClick={handlePayment}
                disabled={loading}
                style={{
                    display: "block", width: "100%", padding: "12px", borderRadius: "8px",
                    background: loading ? "#555" : GOLD, color: "#000", fontWeight: "bold",
                    cursor: "pointer", border: "none"
                }}
            >
                {loading ? "Processing..." : `Pay ৳${amount || '0'}`}
            </button>
        </div>
    );
};

export default PaymentComponent;