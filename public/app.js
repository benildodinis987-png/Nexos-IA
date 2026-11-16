const log = document.getElementById('log');
const form = document.getElementById('form');
const input = document.getElementById('input');
const send = document.getElementById('send');
let history = [];
try { history = JSON.parse(localStorage.getItem('devsec_chat') || '[]'); } catch (e) {}
const save = () => { try { localStorage.setItem('devsec_chat', JSON.stringify(history.slice(-40))); } catch (e) {} };

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function md(t) {
  return t.split(/```(?:\w*)\n?([\s\S]*?)```/g).map((part, i) => i % 2
    ? '<pre><button class="copy" type="button">Copiar</button><code>' + esc(part) + '</code></pre>'
    : esc(part).replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
  ).join('');
}

function add(role, text) {
  const d = document.createElement('div');
  d.className = 'msg ' + role;
  d.innerHTML = role === 'user' ? esc(text).replace(/\n/g, '<br>') : md(text);
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
  return d;
}

function welcome() {
  add('assistant', 'Olá! Sou o DevSec AI. Posso ajudar com programação, servidores, redes e segurança. O que vamos construir ou resolver?');
}

function load() {
  log.innerHTML = '';
  if (!history.length) return welcome();
  history.forEach(m => add(m.role, m.content));
}

function autosize() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 160) + 'px';
}

log.addEventListener('click', e => {
  if (e.target.classList.contains('copy')) {
    navigator.clipboard.writeText(e.target.nextElementSibling.textContent);
    e.target.textContent = 'Copiado';
    setTimeout(() => (e.target.textContent = 'Copiar'), 1500);
  }
});

input.addEventListener('input', autosize);
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
});

document.getElementById('clear').addEventListener('click', () => { history = []; save(); load(); });

form.addEventListener('submit', async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  autosize();
  add('user', text);
  history.push({ role: 'user', content: text });
  send.disabled = true;
  const wait = add('assistant', 'A pensar…');
  wait.classList.add('wait');
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Erro desconhecido');
    wait.classList.remove('wait');
    wait.innerHTML = md(d.reply);
    history.push({ role: 'assistant', content: d.reply });
    save();
  } catch (err) {
    wait.remove();
    history.pop();
    add('assistant', '⚠️ ' + err.message);
    input.value = text;
  }
  send.disabled = false;
  log.scrollTop = log.scrollHeight;
});

load();
