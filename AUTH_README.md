# Firebase Auth (login + profile) — GratiaCine

Este branch adiciona um fluxo mínimo de autenticação usando Firebase Authentication (Email/Password), páginas de frontend para login e perfil, e um script Node que cria um usuário admin de teste usando o Firebase Admin SDK.

Arquivos adicionados
- public/login.html — formulário de login
- public/profile.html — página de perfil protegida
- public/js/auth.js — integração mínima com Firebase Auth (compat)
- scripts/create-admin-firebase.js — cria um usuário admin e aplica custom claim {admin:true}
- package.json — dependência para rodar script de criação de admin

Credenciais de teste (seed)
- Email: admin@example.com
- Senha: Senha123!

Como configurar (resumo)
1. Crie um projeto no Firebase (https://console.firebase.google.com/)
2. Ative Authentication → Sign-in method → Email/Password
3. Crie um Web App no Firebase e copie o config; substitua `firebaseConfig` em `public/js/auth.js` com os valores do seu Web App.
4. Gere uma service account (Console → Project settings → Service accounts) e baixe o JSON. NÃO commite esse arquivo no repo.
5. No terminal, instale dependências e rode o script:

```bash
npm ci
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json npm run create-admin
```

6. Sirva a pasta `public/` (ex.: `npx serve public`) e acesse `login.html`.

Observações de segurança
- NUNCA commite `serviceAccountKey.json` nem senhas reais.
- Troque a senha do admin após testes.
- Em produção, use variáveis de ambiente seguras para configurações.

Próximos passos sugeridos
- Substituir o uso das bibliotecas compat por modular (opcional).
- Adicionar proteção de rota no servidor se houver backend.
- Adicionar testes e validações de formulário.
