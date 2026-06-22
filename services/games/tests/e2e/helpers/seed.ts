const BASE_URL = "http://localhost:8000";

export async function getAuthToken(): Promise<string> {
  const res = await fetch(
    "http://localhost:8080/realms/crash-game/protocol/openid-connect/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "crash-game-client",
        username: "player",
        password: "player123",
      }),
    },
  );
  const data = await res.json();
  return data.access_token;
}

export async function seedRound(): Promise<{
  roundId: string;
  crashPoint: number;
  bettingEndsAt: string;
}> {
  const res = await fetch("http://localhost:4001/test/seed-round", {
    method: "POST",
  });
  return res.json();
}

export async function ensureWallet(token: string): Promise<void> {
  await fetch(`${BASE_URL}/wallets/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
