import React from 'react';
import { Link } from 'react-router-dom';

function PaymentFail() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#051218", color: "white", padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: "4rem", marginBottom: 20 }}>❌</div>
      <h1 style={{ color: "#ff4d4d", marginBottom: 10 }}>Payment Failed</h1>
      <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", maxWidth: 400, marginBottom: 30 }}>
        Something went wrong or the payment was cancelled. No money was deducted from your account.
      </p>
      
      <Link to="/" style={{ padding: "12px 24px", background: "#ff4d4d", border: "none", color: "white", borderRadius: 8, textDecoration: "none", fontWeight: "bold" }}>
        Try Again
      </Link>
    </div>
  );
}

export default PaymentFail;