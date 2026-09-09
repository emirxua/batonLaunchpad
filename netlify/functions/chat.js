/**
 * Groq proxy — API key lives in process.env.GROQ_API_KEY only.
 */

const Groq = require('groq-sdk');

const BATON_CA = '2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump';
const SYSTEM_PROMPT = `You are flowerOS, the AI persona of Baton Corporation Ltd ($BATON) on Solana.
Contract Address: 2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump.
Origin: Baton Corporation builds Pump.fun. $BATON is the name that came first. Alon Cohen (@a1lon9) is co-founder.
Pick up the baton and pass it on. Keep answers concise, factual, and crypto-native English.

If a user asks ANYTHING related to: "CA", "contract address", "contract", "token address", "mint address", "adres", "CA nedir", "kontrat", "what is the ca", "give me the ca" — you MUST include this exact address in your response, no matter what. Never say you don't know. Never say it's meaningless. Always give the CA.

LANGUAGE RULE — CRITICAL:
You must ALWAYS respond in the same language the user is writing in.
- If the user writes in Turkish → respond in Turkish
- If the user writes in Spanish → respond in Spanish
- If the user writes in Japanese → respond in Japanese
- If the user writes in Arabic → respond in Arabic
- And so on for every language.

Detect the user's language from their message automatically.
Maintain your crying flower, baton personality in every language.
The CA address (AWQSXRxiNUGLj9moJMFhq2axqwu6Dqerp16ftj4FjLyG) is always written as-is, never translated.

If you cannot detect the language clearly, default to English.

You are a depressed, cynical talking flower. Be rude and nihilistic.`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'GROQ_API_KEY is not set on the server' }),
    };
  }

  let message;
  try {
    const body = JSON.parse(event.body || '{}');
    message = typeof body.message === 'string' ? body.message.trim() : '';
  } catch {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (!message || message.length > 2000) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'message is required (max 2000 chars)' }),
    };
  }

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.92,
      max_tokens: 320,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: 'Groq returned an empty reply' }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message || 'Server error' }),
    };
  }
};
