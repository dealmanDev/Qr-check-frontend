# Frontend Layer

A camada frontend é uma aplicação React com Vite, responsável pela interface do utilizador e pelo consumo da API do backend.

## Responsabilidades

- interface web responsiva
- autenticação e fluxo de check-in/check-out
- consumo da API do backend
- build isolada para deploy estático ou em container

## Variáveis de ambiente principais

Defina as variáveis de ambiente no arquivo `frontend/.env` ou no arquivo de ambiente central do projeto.

- `VITE_API_URL`: endereço base da API do backend
- `VITE_APP_NAME`: nome da aplicação exibido na interface

## Comandos do frontend

Instale dependências na pasta `frontend`:

```bash
npm --prefix frontend install
```

Inicie o frontend em modo de desenvolvimento:

```bash
npm --prefix frontend run dev
```

Construa a aplicação para produção:

```bash
npm --prefix frontend run build
```

## Plataformas recomendadas para deploy

- Vercel
- Netlify
- Cloudflare Pages
- Docker container próprio
