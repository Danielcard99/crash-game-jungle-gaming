import { describe, it, expect, beforeAll, beforeEach } from "bun:test";
import { getAuthToken, seedRound, ensureWallet, sleep } from "./helpers/seed";

const BASE_URL = "http://localhost:8000";

let token: string;

beforeAll(async () => {
  token = await getAuthToken();
  await ensureWallet(token);
}, 30000);

beforeEach(async () => {
  // Garante que a rodada anterior terminou antes de cada teste
  await sleep(30000);
}, 35000);

describe("Bet flow E2E", () => {
  it("aposta → cashout → saldo atualizado", async () => {
    const { bettingEndsAt } = await seedRound();

    const betRes = await fetch(`${BASE_URL}/games/bet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountInCents: 10000 }),
    });
    expect(betRes.status).toBe(201);
    const bet = await betRes.json();
    expect(bet.status).toBe("PENDING");

    // Espera RabbitMQ confirmar a aposta
    await sleep(5000);

    // Espera a janela de apostas terminar
    const endsAt = new Date(bettingEndsAt).getTime();
    const now = Date.now();
    if (endsAt > now) {
      await sleep(endsAt - now + 2000);
    }

    // Faz cashout em 1.2x (antes do crash em 1.5x)
    const cashoutRes = await fetch(`${BASE_URL}/games/bet/cashout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentMultiplier: 1.2 }),
    });
    expect(cashoutRes.status).toBe(201);
    const cashout = await cashoutRes.json();
    expect(cashout.status).toBe("CASHED_OUT");
    expect(cashout.payout).toBeGreaterThan(cashout.amountBet);

    // Aguarda processamento RabbitMQ do crédito
    await sleep(3000);

    const walletRes = await fetch(`${BASE_URL}/wallets/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const wallet = await walletRes.json();
    expect(wallet.balance).toBeGreaterThan(0);
  }, 60000);

  it("aposta → crash → aposta perdida", async () => {
    const { roundId } = await seedRound();

    const betRes = await fetch(`${BASE_URL}/games/bet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountInCents: 5000 }),
    });
    expect(betRes.status).toBe(201);

    // Polling até a aposta ser marcada como LOST (engine pode demorar a pegar o round)
    // Intervalo de 3s para não bater o rate limit do Kong (30 req/min)
    let myBet: any;
    for (let i = 0; i < 20; i++) {
      await sleep(3000);
      const betsRes = await fetch(`${BASE_URL}/games/bets/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bets = await betsRes.json();
      myBet = bets.find((b: any) => b.roundId === roundId);
      if (myBet?.status === "LOST") break;
    }
    expect(myBet).toBeDefined();
    expect(myBet.status).toBe("LOST");
  }, 60000);

  it("saldo insuficiente → aposta rejeitada", async () => {
    await seedRound();

    const betRes = await fetch(`${BASE_URL}/games/bet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountInCents: 99999999 }),
    });
    expect(betRes.status).toBe(400);
  }, 10000);

  it("aposta dupla → erro", async () => {
    await seedRound();

    await fetch(`${BASE_URL}/games/bet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountInCents: 1000 }),
    });

    const betRes = await fetch(`${BASE_URL}/games/bet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountInCents: 1000 }),
    });
    expect(betRes.status).toBe(409);
  }, 10000);

  it("aposta durante rodada ativa → erro", async () => {
    // crashPoint alto garante que o round fica em RUNNING tempo suficiente para o teste
    const { bettingEndsAt, roundId } = await seedRound({ crashPoint: 100 });

    // Espera a janela de apostas terminar
    const endsAt = new Date(bettingEndsAt).getTime();
    const now = Date.now();
    if (endsAt > now) {
      await sleep(endsAt - now + 2000);
    }

    // Polling até 30s esperando a rodada estar RUNNING
    let attempts = 0;
    let roundRunning = false;
    while (attempts < 30) {
      const roundRes = await fetch(`${BASE_URL}/games/rounds/current`);
      if (roundRes.ok) {
        const round = await roundRes.json();
        if (round.id === roundId && round.status === "RUNNING") {
          roundRunning = true;
          break;
        }
      }
      await sleep(1000);
      attempts++;
    }

    expect(roundRunning).toBe(true);

    // Tenta apostar durante RUNNING — deve rejeitar com 503
    const betRes = await fetch(`${BASE_URL}/games/bet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountInCents: 1000 }),
    });
    expect(betRes.status).toBe(503);
  }, 80000);
});
