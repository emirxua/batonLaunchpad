/**
 * Vercel Serverless Function: /api/chat
 * Baton Terminal AI Intelligence Engine
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};
  const msg = (message || '').toLowerCase();

  let reply = 'Baton Corporation Ltd is the legal and developmental backbone of Pump.fun. Ask about Alon, the UK corporate filing (#14743013), or the token telemetry.';

  if (msg.includes('ca') || msg.includes('contract') || msg.includes('address')) {
    reply = 'Official Solana CA: `2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump`\n100% LP burned on PumpSwap, 0% tax, verified on-chain.';
  } else if (msg.includes('alon') || msg.includes('hire') || msg.includes('cohen')) {
    reply = 'Alon Cohen (@a1lon9) is the co-founder of Pump.fun. In public posts, he hires directly for Baton Corporation Ltd with offers up to $5M base for Chief Legal Officer.';
  } else if (msg.includes('pump') || msg.includes('origin') || msg.includes('hq') || msg.includes('mildenhall')) {
    reply = 'Pump.fun started under the handle @batonfinance before adopting the pill logo. The physical registered office is Unit A 82, 82a James Carter Rd, Mildenhall, UK.';
  } else if (msg.includes('buy') || msg.includes('dex') || msg.includes('chart')) {
    reply = 'You can trade $BATON directly on Pump.fun or Jupiter. Live telemetry is synced on the Token Radar above.';
  }

  return res.status(200).json({ reply });
};
