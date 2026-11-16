require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.MODEL || 'llama-3.3-70b-versatile';
const SYSTEM = fs.readFileSync(path.join(__dirname, 'prompt.txt'), 'utf8');

if (!process.env.GROQ_API_KEY) {
  console.error('Falta GROQ_API_KEY no ficheiro .env');
  process.exit(1);
}

app.set('trust proxy', 1);
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Limite simples: 15 pedidos por minuto por IP
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 15;
}
setInterval(() => hits.clear(), 600000).unref();

app.post('/api/chat', async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: 'Muitos pedidos. Aguarde um minuto.' });

  const msgs = Array.isArray(req.body.messages) ? req.body.messages.slice(-20) : [];
  const clean = msgs
    .filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));
  if (!clean.length || clean[clean.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Mensagem inválida.' });
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: 'system', content: SYSTEM }, ...clean]
      })
    });
    const data = await r.json();
    if (!r.ok) {
      console.error(data);
      return res.status(502).json({ error: 'Erro da API: ' + ((data.error && data.error.message) || r.status) });
    }
    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    if (!reply) return res.status(502).json({ error: 'A API não devolveu resposta.' });
    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao contactar a API.' });
  }
});

app.listen(PORT, () => console.log('Servidor em http://localhost:' + PORT));
