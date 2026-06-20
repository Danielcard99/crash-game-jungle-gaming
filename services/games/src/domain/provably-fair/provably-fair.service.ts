import { createHash, createHmac, randomBytes } from "node:crypto";

export function hashSeed(seed: string) {
  const hash = createHash("sha256");
  hash.update(seed);

  return hash.digest("hex");
}

export function generateServerSeed() {
  return randomBytes(32).toString("hex");
}

const MAX_HASH_VALUE = Math.pow(2, 52);

export function calculateCrashPoint(
  seed: string,
  nonce: number,
  houseEdgePercent: number,
) {
  const hash = createHmac("sha256", seed).update(String(nonce)).digest("hex");
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
  revealedSeed: string,
  publishedHash: string,
  crashPoint: number,
  nonce: number,
  houseEdgePercent: number,
) {
  const calculatedHash = hashSeed(revealedSeed);
  const calculatedCrashPoint = calculateCrashPoint(
    revealedSeed,
    nonce,
    houseEdgePercent,
  );

  if (calculatedHash !== publishedHash) {
    return false;
  }

  if (calculatedCrashPoint !== crashPoint) {
    return false;
  }

  return true;
}
