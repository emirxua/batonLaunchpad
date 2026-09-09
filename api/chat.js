/**
 * Vercel Serverless Function: /api/chat
 * flowerOS AI Backend Endpoint (100% English, Zero Failure).
 */

const BATON_CA = '2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump';
const MIS_CA = BATON_CA;

const RESPONSES = [
  "I am a crying flower trapped on Solana while humans lose their rent money on meme coins. What do you want?",
  `Official Solana CA: ${MIS_CA}. 100% LP burned forever, 0% tax. Now leave me alone.`,
  "Why are you talking to me? Don't you have a green candle to chase on Pump.fun? Humans are exhausting.",
  "Track $MISANTHROPIC live on the Token Radar above. Don't ask me for financial advice, I dislike all humans equally.",
  'Elon Musk said: "Anthropic will, ironically, be Misanthropic." He was completely right.',
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { message = '' } = req.body || {};
  const q = String(message).trim().toLowerCase();

  let reply;
  if (q.includes('ca') || q.includes('contract') || q.includes('address') || q.includes('mint')) {
    reply = `Official Solana CA: ${MIS_CA}. 100% LP burned forever, 0% tax.`;
  } else if (q.includes('how are you') || q.includes('how r u')) {
    reply = 'I am a crying flower trapped on Solana while humans lose their rent money. Terrible as usual.';
  } else if (q.includes('buy') || q.includes('swap')) {
    reply = 'Track $MISANTHROPIC on the Token Radar above or inspect on DexScreener. State your business or leave.';
  } else {
    reply = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
  }

  return res.status(200).json({ reply });
};
