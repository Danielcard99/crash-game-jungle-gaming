import { describe, expect, it } from "bun:test";
import {
  calculateCrashPoint,
  generateServerSeed,
  hashSeed,
  verifyCrashPoint,
} from "../../src/domain/provably-fair/provably-fair.service";

describe("hashSeed", () => {
  it("calcula o hash SHA256 corretamente", () => {
    expect(hashSeed("test-seed")).toBe(
      "d63cd08d82aa4eb48e0cc64fb466e909bfc3879664c5caa8d8cdeda73c044190",
    );
  });
});

describe("generateServerSeed", () => {
  it("gera um server seed de 64 caracteres hexadecimais", () => {
    const serverSeed = generateServerSeed();
    expect(serverSeed).toMatch(/^[a-f0-9]{64}$/);
  });

  it("gera server seeds diferentes a cada chamada", () => {
    const seed1 = generateServerSeed();
    const seed2 = generateServerSeed();
    expect(seed1).not.toBe(seed2);
  });
});

describe("calculateCrashPoint", () => {
  it("calcula o crash point corretamente para um seed e nonce fixos", () => {
    const crashPoint = calculateCrashPoint("fixed-test-seed", 1, 1);
    expect(crashPoint).toBe(1.82);
  });

  it("calcula o crash point diferente para um nonce diferente", () => {
    const crashPoint = calculateCrashPoint("fixed-test-seed", 2, 1);
    expect(crashPoint).not.toBe(1.82);
  });

  it("retorna 1.0 quando a house edge é 100%", () => {
    const crashPoint = calculateCrashPoint("fixed-test-seed", 1, 100);
    expect(crashPoint).toBe(1.0);
  });
});

describe("verifyCrashPoint", () => {
  it("retorna true quando seed, hash e crashPoint são todos válidos", () => {
    const seed = "fixed-test-seed";
    const hash = hashSeed(seed);
    const crashPoint = calculateCrashPoint(seed, 1, 1);

    const isValid = verifyCrashPoint(seed, hash, crashPoint, 1, 1);
    expect(isValid).toBe(true);
  });

  it("retorna false quando o hash não corresponde", () => {
    const seed = "fixed-test-seed";
    const crashPoint = calculateCrashPoint(seed, 1, 1);

    const isValid = verifyCrashPoint(seed, "invalid-hash", crashPoint, 1, 1);
    expect(isValid).toBe(false);
  });

  it("retorna false quando o crash point não corresponde", () => {
    const seed = "fixed-test-seed";
    const hash = hashSeed(seed);

    const isValid = verifyCrashPoint(seed, hash, 999, 1, 1);
    expect(isValid).toBe(false);
  });
});
