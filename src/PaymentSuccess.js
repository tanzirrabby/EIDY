import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    return (
        <div style={{ textAlign: 'center', padding: '100px', color: 'white', background: '#050505', height: '100vh' }}>
            <h1 style={{ color: '#4ADE80' }}>🎉 Payment Successful!</h1>
            <p>Your Salami has been added to the box successfully.</p>
            <button 
                onClick={() => navigate('/')}
                style={{ padding: '10px 20px', marginTop: '20px', background: '#D4AF37', border: 'none', cursor: 'pointer' }}
            >
                Back to My Gifts
            </button>
        </div>
    );
};

export default PaymentSuccess;