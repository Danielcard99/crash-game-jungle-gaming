import { describe, expect, it } from "bun:test";
import {
  calculateCrashPoint,
  generateClientSeed,
  generateServerSeed,
  hashSeed,
  verifyCrashPoint,
} from "../../src/domain/provably-fair/provably-fair.service";

const SERVER_SEED = "fixed-test-server-seed";
const CLIENT_SEED = "fixed-test-client-seed";
const NONCE = 1;
const HOUSE_EDGE = 1;

describe("hashSeed", () => {
  it("calcula o hash SHA256 corretamente", () => {
    expect(hashSeed("test-seed")).toBe(
      "d63cd08d82aa4eb48e0cc64fb466e909bfc3879664c5caa8d8cdeda73c044190",
    );
  });
});

describe("generateServerSeed", () => {
  it("gera um server seed de 64 caracteres hexadecimais", () => {
    expect(generateServerSeed()).toMatch(/^[a-f0-9]{64}$/);
  });

  it("gera server seeds diferentes a cada chamada", () => {
    expect(generateServerSeed()).not.toBe(generateServerSeed());
  });
});

describe("generateClientSeed", () => {
  it("gera um client seed de 32 caracteres hexadecimais", () => {
    expect(generateClientSeed()).toMatch(/^[a-f0-9]{32}$/);
  });

  it("gera client seeds diferentes a cada chamada", () => {
    expect(generateClientSeed()).not.toBe(generateClientSeed());
  });
});

describe("calculateCrashPoint", () => {
  it("calcula o crash point de forma determinística para seeds e nonce fixos", () => {
    const crashPoint = calculateCrashPoint(SERVER_SEED, NONCE, HOUSE_EDGE, CLIENT_SEED);
    expect(typeof crashPoint).toBe("number");
    expect(crashPoint).toBeGreaterThanOrEqual(1.0);
    // mesmo resultado na segunda chamada (determinístico)
    expect(calculateCrashPoint(SERVER_SEED, NONCE, HOUSE_EDGE, CLIENT_SEED)).toBe(crashPoint);
  });

  it("produz crash points diferentes quando o client seed muda", () => {
    const cp1 = calculateCrashPoint(SERVER_SEED, NONCE, HOUSE_EDGE, "client-a");
    const cp2 = calculateCrashPoint(SERVER_SEED, NONCE, HOUSE_EDGE, "client-b");
    expect(cp1).not.toBe(cp2);
  });

  it("produz crash points diferentes quando o nonce muda", () => {
    const cp1 = calculateCrashPoint(SERVER_SEED, 1, HOUSE_EDGE, CLIENT_SEED);
    const cp2 = calculateCrashPoint(SERVER_SEED, 2, HOUSE_EDGE, CLIENT_SEED);
    expect(cp1).not.toBe(cp2);
  });

  it("retorna 1.0 quando a house edge é 100%", () => {
    const crashPoint = calculateCrashPoint(SERVER_SEED, NONCE, 100, CLIENT_SEED);
    expect(crashPoint).toBe(1.0);
  });

  it("nunca retorna valor menor que 1.0", () => {
    for (let i = 0; i < 50; i++) {
      const cp = calculateCrashPoint(generateServerSeed(), i, HOUSE_EDGE, generateClientSeed());
      expect(cp).toBeGreaterThanOrEqual(1.0);
    }
  });
});

describe("verifyCrashPoint", () => {
  it("retorna true quando serverSeed, clientSeed, hash e crashPoint são válidos", () => {
    const hash = hashSeed(SERVER_SEED);
    const crashPoint = calculateCrashPoint(SERVER_SEED, NONCE, HOUSE_EDGE, CLIENT_SEED);

    expect(verifyCrashPoint(SERVER_SEED, hash, CLIENT_SEED, crashPoint, NONCE, HOUSE_EDGE)).toBe(true);
  });

  it("retorna false quando o hash do server seed não corresponde", () => {
    const crashPoint = calculateCrashPoint(SERVER_SEED, NONCE, HOUSE_EDGE, CLIENT_SEED);

    expect(verifyCrashPoint(SERVER_SEED, "wrong-hash", CLIENT_SEED, crashPoint, NONCE, HOUSE_EDGE)).toBe(false);
  });

  it("retorna false quando o crash point não corresponde", () => {
    const hash = hashSeed(SERVER_SEED);

    expect(verifyCrashPoint(SERVER_SEED, hash, CLIENT_SEED, 999, NONCE, HOUSE_EDGE)).toBe(false);
  });

  it("retorna false quando o client seed é diferente do original", () => {
    const hash = hashSeed(SERVER_SEED);
    const crashPoint = calculateCrashPoint(SERVER_SEED, NONCE, HOUSE_EDGE, CLIENT_SEED);

    expect(verifyCrashPoint(SERVER_SEED, hash, "wrong-client-seed", crashPoint, NONCE, HOUSE_EDGE)).toBe(false);
  });

  it("retorna false quando o nonce é diferente do original", () => {
    const hash = hashSeed(SERVER_SEED);
    const crashPoint = calculateCrashPoint(SERVER_SEED, NONCE, HOUSE_EDGE, CLIENT_SEED);

    expect(verifyCrashPoint(SERVER_SEED, hash, CLIENT_SEED, crashPoint, 999, HOUSE_EDGE)).toBe(false);
  });
});
