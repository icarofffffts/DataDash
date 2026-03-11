# 📖 Product Requirements Document (PRD) - DataDash

## 1. Visão Geral
O **DataDash** é uma ferramenta analítica web projetada para simplificar a visualização de dados operacionais e de atendimento. O objetivo principal é permitir que usuários sem conhecimentos técnicos de BI possam extrair insights rápidos de arquivos CSV.

## 2. Objetivos de Negócio
- Democratizar o acesso à análise de dados.
- Reduzir o tempo gasto em formatação manual de planilhas.
- Utilizar IA generativa para explicar correlações complexas de dados.

## 3. Arquitetura Técnica

### 3.1 Stack Tecnológica
- **Frontend**: Next.js 15 (React 19) para renderização otimizada e navegação.
- **Processamento de Dados**: PapaParse rodando no lado do cliente para privacidade e performance.
- **Visualização**: Recharts para gráficos escaláveis em SVG.
- **IA**: Google Gemini API para análise de linguagem natural sobre os dados estruturados.

### 3.2 Fluxo de Dados
1. **Entrada**: Usuário faz o upload de um arquivo `.csv`.
2. **Parsing**: PapaParse converte o CSV em um array de objetos JSON no navegador.
3. **Mapeamento**: O sistema identifica automaticamente colunas de data, categorias e valores numéricos (baseado no tipo `Ticket`).
4. **Visualização**: Gráficos de barra, linha e dispersão são renderizados com base nos dados filtrados.
5. **Análise IA**: Os dados resumidos são enviados para o Gemini Pro, que retorna um relatório em texto com os principais insights.

## 4. Requisitos Funcionais

| ID | Requisito | Descrição |
|---|---|---|
| RF01 | Upload de Arquivo | Suporte a arquivos CSV de até 10MB. |
| RF02 | Gráficos Dinâmicos | Filtragem por data e categoria direto no dashboard. |
| RF03 | Insights de IA | Botão para gerar análise preditiva ou descritiva via Gemini. |
| RF04 | Limpeza de Dados | Opção para resetar o dashboard e carregar novo arquivo. |

## 5. Guia de Deploy (Docker)

O projeto inclui um `Dockerfile` pronto para produção:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
RUN npm install --production
EXPOSE 3000
CMD ["npm", "start"]
```

Com Docker Compose:
```bash
docker-compose up -d
```
