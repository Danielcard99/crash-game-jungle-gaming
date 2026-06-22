import { createHash, createHmac, randomBytes } from "node:crypto";

export function hashSeed(seed: string) {
  const hash = createHash("sha256");
  hash.update(seed);

  return hash.digest("hex");
}

export function generateServerSeed() {
  return randomBytes(32).toString("hex");
}

export function generateClientSeed() {
  return randomBytes(16).toString("hex");
}

const MAX_HASH_VALUE = Math.pow(2, 52);

// The HMAC message combines clientSeed and nonce so that neither the house
// (who knows serverSeed) nor the player (who controls clientSeed) can alone
// predict the crash point before the round starts.
export function calculateCrashPoint(
  serverSeed: string,
  nonce: number,
  houseEdgePercent: number,
  clientSeed: string,
) {
  const message = `${clientSeed}:${nonce}`;
  const hash = createHmac("sha256", serverSeed).update(message).digest("hex");
  const hashAsInt = parseInt(hash.slice(0, 13), 16);

  if (hashAsInt % Math.floor(100 / houseEdgePercent) === 0) {
    return 1.0;
  }

  const crashPoint =
    Math.floor(
      (100 * MAX_HASH_VALUE - hashAsInt) / (MAX_HASH_VALUE - hashAsInt),
    ) / 100;

  return Math.max(1.0, crashPoint);
}

export function verifyCrashPoint(
  revealedServerSeed: string,
  publishedHash: string,
  clientSeed: string,
  crashPoint: number,
  nonce: number,
  houseEdgePercent: number,
) {
  const calculatedHash = hashSeed(revealedServerSeed);
  const calculatedCrashPoint = calculateCrashPoint(
    revealedServerSeed,
    nonce,
    houseEdgePercent,
    clientSeed,
  );

  if (calculatedHash !== publishedHash) {
    return false;
  }

  if (calculatedCrashPoint !== crashPoint) {
    return false;
  }

  return true;
}
