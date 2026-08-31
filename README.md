# Gratia — Clube de Cinema

Este repositório contém o site estático do Gratia (painel do clube de cinema) e um esqueleto para integrações com Letterboxd, TMDb e Firebase.

IMPORTANTE: este repositório inclui placeholders para chaves/credentials. Você deverá provisionar:

- Um projeto no Firebase (Firestore, Auth, Storage habilitados).
- Uma chave TMDb (https://www.themoviedb.org/settings/api).
- Variáveis de ambiente no Vercel/Netlify: TMDB_API_KEY, FIREBASE_CONFIG (JSON string) e outras conforme instruções abaixo.

O que eu coloquei aqui
- index.html — a UI principal (origem: arquivo que você enviou), adaptada para integrar com Firebase e funções serverless.
- api/ — funções serverless (letterboxd-sync.js, tmdb-proxy.js) para rodar em Vercel/Netlify.
- firebase-client.js — cliente front-end para autenticação, uploads e integração com Firestore (com placeholders).
- README com instruções de configuração.

Deploy recomendado (eu configurei o scaffold, mas é necessário que você finalize as chaves):
1. Crie um projeto no Firebase. Habilite Authentication (Email/password), Firestore e Storage.
2. Obtenha a configuração do Firebase (FIREBASE_CONFIG) e salve como variável de ambiente ou arquivo `firebase-config.json` localmente.
3. Crie uma chave TMDb e coloque em TMDB_API_KEY nas variáveis de ambiente do Vercel.
4. Conecte o repositório no Vercel e faça deploy (Vercel irá instalar dependências e publicar as funções em /api/* automaticamente).
5. Ative GitHub Pages (opcional) — o site estático também pode ser publicado via Pages.

Sincronização Letterboxd
- As funções serverless expõem um endpoint `/api/letterboxd-sync?username=<user>` que busca o feed RSS público de Letterboxd para o usuário e retorna filmes vistos/entries.
- Você deve configurar uma chamada agendada (cron) ou webhook (manual) para sincronizar automaticamente.

Busca de dados de diretores
- Ao adicionar filmes no histórico, o front-end pode chamar `/api/tmdb-proxy?title=<title>&year=<year>` para obter dados do filme (incl. imdb_id e credits). A função usa TMDb.

Autenticação e uploads de avatar
- O front-end usa Firebase Auth e Storage: cada usuário pode fazer login (email/password) e carregar avatar/banner. As imagens são gravadas no Storage e o URL salvo no Firestore.

Se preferir eu posso continuar e ajudar a completar a configuração do Vercel e Firebase (criar usuários iniciais, definir variáveis de ambiente). Veja abaixo instruções rápidas.
