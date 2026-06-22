# Crash Game — Jungle Gaming

Implementação fullstack de um crash game multiplayer em tempo real.

## Stack

| Camada      | Tecnologia                                                                    |
| ----------- | ----------------------------------------------------------------------------- |
| Runtime     | Bun                                                                           |
| Backend     | NestJS + TypeScript strict + Prisma + PostgreSQL 18                           |
| Mensageria  | RabbitMQ                                                                      |
| API Gateway | Kong (DB-less, declarativo)                                                   |
| Auth        | Keycloak (OIDC, PKCE S256)                                                    |
| WebSocket   | @nestjs/websockets + socket.io                                                |
| Frontend    | TanStack Start (SSR) + Tailwind CSS v4 + shadcn/ui + Zustand + TanStack Query |

## Setup

### Pré-requisitos

- Bun >= 1.x
- Docker & Docker Compose

### Subir tudo

```bash
git clone https://github.com/Danielcard99/crash-game-jungle-gaming
cd crash-game-jungle-gaming
bun install
bun run docker:up
```

Acesse `http://localhost:3000` e faça login com `player` / `player123`.

O usuário `player` já possui R$1.000,00 de saldo creditado automaticamente via script de seed — nenhum passo manual necessário.

### Comandos

```bash
bun run docker:up      # Sobe tudo (infra + serviços + frontend + seed)
bun run docker:down    # Para os containers
bun run docker:prune   # Remove tudo (containers, volumes, imagens)
```

## Acessos

| Serviço            | URL                      | Credenciais       |
| ------------------ | ------------------------ | ----------------- |
| Frontend           | http://localhost:3000    | player / player123 |
| Kong (API Gateway) | http://localhost:8000    | —                 |
| Keycloak           | http://localhost:8080    | admin / admin     |
| RabbitMQ UI        | http://localhost:15672   | admin / admin     |

## Testes

### Unitários

```bash
cd services/games && bun test tests/unit
cd services/wallets && bun test tests/unit
```

### E2E

Os testes E2E requerem os containers rodando em modo de teste:

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d
cd services/games && bun test tests/e2e
```

Os testes E2E usam seed determinística — um endpoint de controle (`POST /test/seed-round`, disponível apenas com `NODE_ENV=test`) injeta rodadas com `crashPoint` fixo em 1.5x, permitindo testar cenários específicos sem depender do timing aleatório do motor.

## Decisões de Arquitetura

### Por que TanStack Start?

É a stack preferida da Jungle Gaming e a escolha mais alinhada com o ecossistema do desafio. TanStack Start oferece SSR nativo com Nitro, roteamento baseado em arquivos com type safety end-to-end e integração natural com TanStack Query para server state. A alternativa Next.js teria sido mais simples de configurar, mas menos coerente com a stack declarada.

### Por que Prisma?

Type safety superior em comparação com TypeORM e MikroORM — o cliente gerado reflete exatamente o schema, eliminando erros de tipo em tempo de execução. Migrations automáticas e o `prisma studio` aceleram o desenvolvimento. O único trade-off é o overhead do cliente gerado, irrelevante na escala desse projeto.

### Por que Kong DB-less?

Configuração declarativa via YAML versionada no repositório — zero passos manuais, zero estado externo. A alternativa com banco PostgreSQL exigiria migrations e seed do Kong, adicionando complexidade desnecessária. Kong DB-less é suficiente para roteamento, CORS e WebSocket proxy.

### Por que RabbitMQ e não Kafka ou SQS?

RabbitMQ é mais simples de configurar localmente e suficiente para o volume desse projeto. At-least-once delivery cobre o requisito de consistência entre Game e Wallet Service. Kafka seria mais adequado para event sourcing e alta escala — complexidade desnecessária aqui. SQS via LocalStack adicionaria uma dependência de simulação que pode introduzir diferenças de comportamento.

### Por que comunicação assíncrona entre serviços?

Acoplamento temporal zero — Game Service não depende da disponibilidade do Wallet Service para confirmar uma aposta. Se o Wallet Service estiver temporariamente indisponível, as mensagens ficam enfileiradas no RabbitMQ e são processadas quando ele voltar. A alternativa síncrona (REST entre serviços) criaria dependência direta e pontos únicos de falha.

---

## Bounded Contexts

**Game Service** (porta 4001) — ciclo de vida da rodada, apostas, provably fair, WebSocket, motor de rodadas.

**Wallet Service** (porta 4002) — carteira do jogador, crédito/débito via eventos RabbitMQ.

---

## Saga de Aposta

O fluxo de aposta é assíncrono entre os dois serviços:

1. `POST /games/bet` — Game Service cria a aposta em `PENDING` e publica `bet.placed` no RabbitMQ
2. Wallet Service consome `bet.placed`, debita o saldo e publica `bet.confirmed` ou `bet.rejected`
3. Game Service consome a resposta e atualiza o status para `ACTIVE` ou `REJECTED`
4. No crash, Game Service marca apostas `ACTIVE` como `LOST` e publica `bet.lost`
5. No cashout, Game Service marca como `CASHED_OUT` e publica `bet.won`
6. Wallet Service credita o payout ao jogador

---

## Precisão Monetária

Todos os valores são armazenados em centavos inteiros (`BIGINT`). Nenhuma operação usa ponto flutuante. O Value Object `Money` encapsula as regras de precisão e o `BetAmount` valida os limites (mínimo R$1,00, máximo R$1.000,00).

Ponto flutuante para dinheiro introduz erros de arredondamento acumulativos — em cassinos, esses erros podem favorecer a casa ou o jogador de forma inconsistente, criando problemas regulatórios e de auditoria.

---

## Provably Fair

O crash point é gerado via HMAC-SHA256:

```
hash = HMAC-SHA256(serverSeed, nonce)
crashPoint = max(1.0, (1 / (1 - houseEdge)) * e ^ (hash / MAX_HASH))
```

O `serverSeedHash` é exposto antes da rodada começar. Após o crash, o `serverSeed` é revelado, permitindo ao jogador verificar independentemente o resultado via `GET /games/rounds/:roundId/verify`.

House edge configurado em 1% (RTP 99%).

---

## Motor de Rodadas

O `RoundEngineService` roda continuamente em background. A cada ciclo:

1. Verifica se existe uma rodada em `BETTING` no banco (suporta seed determinística em testes)
2. Se não existe, cria uma nova rodada com seed aleatória
3. Aguarda a janela de apostas (10s)
4. Inicia o loop de multiplicador a cada 100ms: `m(t) = e^(0.06 * t)`
5. Quando o multiplicador atinge o `crashPoint`, liquida todas as apostas ativas

---

## WebSocket

Eventos emitidos pelo servidor (server → client):

| Evento          | Payload                                                  |
| --------------- | -------------------------------------------------------- |
| `round:created` | `{ roundId, serverSeedHash, bettingEndsAt }`             |
| `round:started` | `{ roundId }`                                            |
| `round:tick`    | `{ roundId, currentMultiplier }`                         |
| `round:crashed` | `{ roundId, crashPoint, serverSeed, serverSeedHash }`    |
| `bet:placed`    | `{ roundId, playerUsername, amountBet }`                 |
| `bet:cashedOut` | `{ roundId, playerUsername, cashoutMultiplier, payout }` |

Todas as ações do jogador (apostar, sacar) são feitas via REST. WebSocket é exclusivamente server → client.

---

## Get-or-Create de Carteira

`GET /wallets/me` cria automaticamente a carteira na primeira chamada. Decisão consciente: todo jogador autenticado deve ter carteira — não faz sentido ter estado onde o jogador está logado mas sem carteira.

Como o registro acontece no Keycloak (IdP externo) sem webhook configurado pro backend, o get-or-create no primeiro acesso é o trade-off mais prático. A alternativa correta seria um webhook do Keycloak notificando o backend no registro, mas adicionaria configuração extra desnecessária para esse escopo.

---

## Frontend (TanStack Start)

SSR com Nitro. Os assets estáticos (`dist/client/`) são servidos diretamente pelo servidor Nitro via handler customizado em `src/server.ts`, interceptando requisições `/assets/*` e lendo os arquivos do filesystem. Isso elimina a necessidade de nginx como proxy reverso separado.

Variáveis `VITE_*` são injetadas em tempo de build pelo Vite — não em runtime. O Dockerfile faz o build dentro do container com as variáveis corretas.

---

## Seed do Usuário de Teste

O script `docker/scripts/seed-wallet.sh` roda automaticamente após o `docker:up`:

1. Aguarda o Keycloak ficar healthy
2. Busca o UUID do usuário `player` via Keycloak Admin API (dinâmico — funciona em qualquer máquina)
3. Aguarda o Wallet Service ficar healthy
4. Chama `POST /wallets/seed` com o UUID e uma chave secreta
5. Credita R$1.000,00 na carteira

---

## Bônus Implementados

- **Seed determinística para testes E2E** — `POST /test/seed-round` injeta rodadas com `crashPoint` fixo
- **Fórmula da curva na UI** — exibida no frontend com house edge e RTP

---

## Trade-offs Conscientes

- A seed determinística foi implementada via endpoint HTTP (`POST /test/seed-round`, só existe com `NODE_ENV=test`) em vez de script SQL direto — isso garante que o estado criado respeita as invariantes de domínio (usa `Round.create()` e `RoundRepository`), evitando inserções que poderiam deixar o banco em estado inconsistente. Ativado via `docker-compose.test.yml`, nunca exposto em produção.
- Não foi implementado Outbox/Inbox transacional — at-least-once delivery do RabbitMQ é suficiente para o escopo, mas em produção real seria necessário para garantir exactly-once processing.
- O `bettingWindowSeconds` nos testes E2E usa 10s (igual ao motor) para manter comportamento consistente com o ambiente de produção.
