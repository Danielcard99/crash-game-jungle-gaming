import { describe, expect, it } from "bun:test";
import { calculateCurrentMultiplier } from "../../src/domain/round/multiplier-calculator";

describe("calculateCurrentMultiplier", () => {
  it("retorna 1.00 no instante zero", () => {
    expect(calculateCurrentMultiplier(0)).toBe(1.0);
  });

  it("aumenta conforme o tempo passa", () => {
    const early = calculateCurrentMultiplier(1);
    const later = calculateCurrentMultiplier(5);

    expect(later).toBeGreaterThan(early);
  });

  it("lança erro com tempo negativo", () => {
    expect(() => calculateCurrentMultiplier(-1)).toThrow();
  });
});
