// api/init-payment.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method Not Allowed',
      allowed: ['POST'],
    });
  }

  const { amount, boxId, senderName } = req.body;

  if (!amount || !boxId || !senderName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // 🔹 TEMP TEST RESPONSE (replace with aamarPay later)
  return res.status(200).json({
    url: 'https://example.com/payment-gateway',
  });
}