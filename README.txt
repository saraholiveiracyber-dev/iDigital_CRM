iDIGITAL CRM 2.0 — Área de Clientes

Arquivos:
- clientes.html
- css/clientes.css
- js/clientes.js
- supabase/clientes_asaas.sql

Instalação:
1. Coloque os arquivos nas pastas correspondentes do seu CRM.
2. Execute o SQL no Supabase SQL Editor.
3. Abra clientes.html pelo mesmo projeto do dashboard.
4. Confirme que a tabela clientes já possui user_id.
5. Crie as Edge Functions do Asaas antes de habilitar cobranças reais.

Segurança:
- NÃO coloque a API Key do Asaas em clientes.js.
- Use Supabase Edge Functions + Secrets.
- Use Sandbox do Asaas durante o desenvolvimento.
