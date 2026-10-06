# LMS-Filmes-ref 🎬

> **Versão refatorada e ultra-otimizada do ecossistema LMS-Filmes.**
> Desenvolvida seguindo o mesmo padrão de excelência aplicado no `life-os-ref`: **Monólito Modular** em Spring Boot 3.3.4 (Java 21 com Virtual Threads), **In-Memory Event Bus** + **SSE (Server-Sent Events)** substituindo o RabbitMQ, **PostgreSQL**, **Redis Cache** e um **Frontend SPA Ultra-rápido** em React 19 + Vite 8 + Tailwind CSS v4.

---

## ⚡ Principais Otimizações e Diferenciais

| Recurso | LMS-Filmes Original | LMS-Filmes-ref (Novo) |
|---|---|---|
| **Arquitetura Backend** | 4 Microserviços JVM separados + Gateway + Eureka + Config Server | **1 Monólito Modular** em Spring Boot 3 (Java 21) |
| **Consumo de Memória (RAM)** | ~2.5 GB a 3.0 GB | **~400 MB a 550 MB** |
| **Comunicação / Fila** | RabbitMQ Broker externo pesado | **In-Memory Spring Events** (`@EventListener` / `@Async`) + **SSE** (`/notifications/stream`) |
| **Banco de Dados** | MongoDB (legado) / Postgres fragmentado | **PostgreSQL** unificado com índices e transações ACID |
| **Cache de Produção** | Redis disperso | **Redis Cache** com TTLs dedicados por módulo e serialização JSON |
| **Frontend** | Next.js com SSR pesado e build demorado | **SPA Ultrarrápido** (React 19 + Vite 8 + Tailwind v4 + Zustand + TanStack Query) servido via Nginx Alpine |
| **Compatibilidade de APIs** | Portas fragmentadas (`8080`, `8081`, `8082`, `8083`, `8084`) | **100% retrocompatível** (rotas diretas e prefixadas, portas e network aliases emulados) |

---

## 🧱 Arquitetura Monolítica Modular

O backend foi unificado em módulos com baixo acoplamento e alta coesão:

```
backend/src/main/java/com/lms/filmes/
├── core/
│   ├── config/             # CORS, Redis Cache, WebClient TMDB, Virtual Threads
│   ├── exception/          # Handlers globais de erro
│   └── security/           # JWT Stateless Filter, Contexto do Usuário
├── shared/event/           # Eventos desacoplados em memória (UserRegistered, CatalogSync, etc.)
└── modules/
    ├── auth/               # Registro, Login JWT, Refresh e Recuperação de Senha
    ├── catalog/            # Integração TMDB de Filmes, Séries, Temporadas e Atores
    ├── rating/             # Avaliações (0.5-10), resenhas, rewatch count, balanço e dashboard
    ├── favorite/           # Favoritos (filmes, séries, atores), Watchlist, Listas customizadas
    ├── notification/       # Gerenciador SSE (Server-Sent Events) e Sessão Pipoca às 18:30
    └── email/              # Disparo de e-mails assíncronos (Thymeleaf templates)
```

---

## 🔌 Compatibilidade Total com outros Serviços (ex: life-os-ref)

Outros microserviços integrados (como o `ReleaseRadarService` do `life-os-ref`) continuam funcionando sem necessidade de alteração de código ou URLs:

- **Aliases no Docker Compose:** `lmsfilmes`, `lmsfavorite`, `lmsrating`, `lms-email`, `lms-backend`, `gateway`.
- **Mapeamento de portas:** Mapeadas tanto as portas legadas (`8080`, `8081`, `8082`, `8083`, `8084`) quanto a porta unificada `8080`.
- **Prefixos de rotas suportados:**
  - `/movies/**`, `/lms-filmes/movies/**`, `/lmsfilmes/movies/**`
  - `/series/**`, `/lms-filmes/series/**`, `/lmsfilmes/series/**`
  - `/rate/**`, `/lms-rating/rate/**`, `/lmsrating/rate/**`
  - `/favorite/**`, `/lms-favorite/favorite/**`, `/lmsfavorite/favorite/**`
  - `/watchlist/**`, `/lms-favorite/watchlist/**`

---

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados
- Uma chave de API gratuita do TMDB ([The Movie Database](https://developer.themoviedb.org/docs))

### 1. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Edite o arquivo `.env` inserindo sua chave `TMDB_API_KEY` (e as credenciais de SMTP caso deseje envio real de e-mails).

### 2. Subir Tudo com Docker Compose
```bash
docker compose up -d --build
```

O compose inicializa:
1. `lms-postgres`: PostgreSQL 16 na porta `5432`
2. `lms-redis`: Redis 7 Alpine na porta `6379`
3. `lms-backend`: Monólito Modular Spring Boot na porta `8080` (e aliases de microserviços)
4. `lms-frontend`: SPA React + Vite no Nginx na porta `3000` (ou `80`)

Acesse no navegador:
👉 **http://localhost:3000**

---

## 💻 Desenvolvimento Local

### Backend (Spring Boot 3)
```bash
cd backend
./mvnw spring-boot:run
```
Requer JDK 21 e PostgreSQL / Redis rodando.

### Frontend (React 19 + Vite)
```bash
cd frontend
npm.cmd install
npm.cmd run dev
```
Acesse: `http://localhost:5173`
Proxy reverso para a API já pré-configurado no `vite.config.ts`.

---

## 📄 Licença
Distribuído sob a licença MIT.
