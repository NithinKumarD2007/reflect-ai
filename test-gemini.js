const apiKey = process.env.GEMINI_API_KEY;
const prompt = 'um like I need to buy groceries you know and uh fix the bug in the app';
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=' + apiKey, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: 'Clean up this raw voice note, remove fillers, fix grammar. Return only the cleaned text. Input: ' + prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
  })
}).then(r => r.json()).then(d => {
  const text = d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (text) console.log('ENHANCE WORKS:', text);
  else console.error('Failed:', JSON.stringify(d?.error));
});
