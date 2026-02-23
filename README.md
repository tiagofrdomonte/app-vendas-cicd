# Sales Web App (Node.js + PostgreSQL + Docker + GitHub Actions)

Aplicação web simples para gestão de vendas com:
- Base de clientes
- Base de produtos
- Criação de ordens de venda com múltiplos itens
- Cálculo de total da ordem

## Arquitetura
- `app` container: Node.js + Express + EJS
- `db` container: PostgreSQL (schema inicial com script SQL)
- CI/CD: GitHub Actions para testar, buildar e publicar as imagens no Docker Hub

## Funcionalidades
- Cadastro e listagem de clientes
- Cadastro e listagem de produtos
- Criação de ordem de venda com itens
- Visualização de detalhes da ordem

## Segurança aplicada
- Sem segredos hardcoded no código
- Configuração por variáveis de ambiente (`.env`)
- `helmet` para cabeçalhos HTTP de segurança
- `express-rate-limit` para limitar requisições
- Validação de entrada com `express-validator`
- Queries parametrizadas com `pg` (evita SQL Injection)
- Container do app roda com usuário não-root

## Estrutura
- `src/`: aplicação web
- `db/`: Dockerfile e scripts de inicialização do banco
- `.github/workflows/ci-cd.yml`: pipeline CI/CD
- `docker-compose.yml`: orquestração local

## Pré-requisitos
- Docker + Docker Compose
- Git
- Conta no Docker Hub
- Repositório no GitHub

## Configuração local
1. Copie variáveis de ambiente:
```bash
cp .env.example .env
```
2. Ajuste os valores sensíveis no `.env` (principalmente `DB_PASSWORD`).
3. Suba os containers:
```bash
docker compose up --build -d
```
4. Acesse:
- App: `http://localhost:3000`

## Subir para GitHub
1. Inicialize git e versione:
```bash
git init
git add .
git commit -m "feat: initial sales app with docker and ci/cd"
```
2. Crie o repositório remoto e faça push:
```bash
git branch -M main
git remote add origin <URL_DO_REPO>
git push -u origin main
```

## Configurar CI/CD no GitHub Actions
No repositório GitHub, configure os secrets:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Pipeline (`.github/workflows/ci-cd.yml`):
- Em qualquer push/PR: instala dependências, executa testes e builda as imagens
- Em push na branch `main`: faz login no Docker Hub e publica:
  - `sales-app:<sha>` e `sales-app:latest`
  - `sales-db:<sha>` e `sales-db:latest`

## Fluxo automático de atualização
Depois de configurado:
1. Você altera o código
2. Faz commit e push para `main`
3. GitHub Actions executa CI/CD
4. Imagens atualizadas são publicadas no Docker Hub automaticamente

## Variáveis de ambiente principais
Consulte `.env.example`:
- App: `APP_NAME`, `HOST`, `PORT`
- Banco: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`
- Segurança: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`
- Docker tags: `DOCKERHUB_USERNAME`, `APP_IMAGE_TAG`, `DB_IMAGE_TAG`

## Observações
- `.env` está no `.gitignore` para não versionar segredos.
- O schema é aplicado automaticamente no primeiro boot do container `db`.
- Se o volume do banco já existir, scripts de init não rodam novamente.
