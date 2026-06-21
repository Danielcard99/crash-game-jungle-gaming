import { describe, expect, it, beforeAll } from "bun:test";

import { JwtStrategy } from "../../src/jwt.strategy";

describe("JwtStrategy.validate", () => {
  beforeAll(() => {
    process.env.KEYCLOAK_URL = "http://keycloak:8080";
    process.env.KEYCLOAK_ISSUER_URL = "http://localhost:8080";
    process.env.KEYCLOAK_REALM = "crash-game";
  });

  it("mapeia o payload do token pros campos esperados", () => {
    const strategy = new JwtStrategy();

    const result = strategy.validate({
      sub: "user-id-123",
      preferred_username: "player",
    });

    expect(result).toEqual({
      userId: "user-id-123",
      username: "player",
    });
  });
});
