/**
 * Hisab Pagar - AI Summary proxy (Cloudflare Worker)
 *
 * Why this exists: the Gemini API key must NEVER be inside the mobile app
 * (it can be extracted and abused). The app talks to this tiny worker, and
 * the worker holds the key as a secret and talks to Gemini.
 *
 * Deploy (free): see README.md in this folder.
 * Required secret:  GEMINI_API_KEY  (set with `wrangler secret put GEMINI_API_KEY`)
 */

const MODEL = 'gemini-2.5-flash'; // free tier; you can change to another Gemini model

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: 'Server missing GEMINI_API_KEY' }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    const data = body && body.data;
    const language = (body && body.language) || 'en';
    if (!data) return json({ error: 'Missing data' }, 400);

    const langName = LANGUAGES[language] || 'English';
    const prompt =
      `You are a friendly assistant for an Indian small-business owner who uses an app ` +
      `to track staff attendance and salary. Based ONLY on the JSON data below, write a short, ` +
      `simple monthly summary in ${langName}. Use 4 to 6 short bullet points (start each line with "• "). ` +
      `Cover: total wage cost, overall attendance, who was absent the most, total dues still to be paid, ` +
      `and one friendly suggestion. Use the ₹ symbol for money. Keep it plain and encouraging, no jargon, ` +
      `no markdown headings, no extra commentary before or after the bullets.\n\n` +
      `Data:\n${JSON.stringify(data)}`;

    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 800,
              // Gemini 2.5 models "think" before answering, and that thinking
              // counts against maxOutputTokens — which truncated short summaries.
              // We don't need reasoning for a few bullet points, so turn it off.
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );
      const j = await r.json();
      if (!r.ok) {
        return json({ error: 'Gemini error', detail: j }, 502);
      }
      const text =
        j &&
        j.candidates &&
        j.candidates[0] &&
        j.candidates[0].content &&
        j.candidates[0].content.parts &&
        j.candidates[0].content.parts[0] &&
        j.candidates[0].content.parts[0].text;
      return json({ summary: (text || 'Could not generate a summary.').trim() }, 200);
    } catch (e) {
      return json({ error: 'Request failed', detail: String(e) }, 500);
    }
  },
};

const LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  od: 'Odia',
  pa: 'Punjabi',
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
