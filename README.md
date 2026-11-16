# DevSec AI

Chat web com servidor em Node.js que guarda a chave da API em segurança.

## Executar
1. Instale o Node.js 18 ou superior.
2. Na pasta do projeto: `npm install`
3. Copie `.env.example` para `.env` e cole a sua chave em `GROQ_API_KEY`.
4. `npm start` e abra http://localhost:3000

## Publicar online
Use um VPS, Render, Railway ou Fly.io. Defina `GROQ_API_KEY` nas variáveis de ambiente
do serviço (nunca no código nem no Git) e o comando de arranque `npm start`.
Atrás de um proxy HTTPS (Nginx, Caddy) o IP real é lido por `trust proxy`.

## Personalizar
O comportamento da IA está em `prompt.txt`. O modelo muda-se em `MODEL` no `.env`. A lista de modelos ativos vê-se em https://console.groq.com/docs/models ou com `curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"`.
Qualquer pessoa com o link gasta o seu saldo da API: se o site for público,
acrescente login ou palavra-passe antes de o divulgar.
