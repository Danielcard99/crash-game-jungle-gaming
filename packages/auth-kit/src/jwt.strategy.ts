import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { passportJwtSecret } from "jwks-rsa";
import { ExtractJwt, Strategy } from "passport-jwt";

function getKeycloakUrl() {
  const url = process.env.KEYCLOAK_URL;

  if (!url) {
    throw new Error("KEYCLOAK_URL environment variable is not set");
  }

  return url;
}

function getKeycloakRealm() {
  const realm = process.env.KEYCLOAK_REALM;

  if (!realm) {
    throw new Error("KEYCLOAK_REALM environment variable is not set");
  }

  return realm;
}

function getKeycloakIssuerUrl() {
  const url = process.env.KEYCLOAK_ISSUER_URL;

  if (!url) {
    throw new Error("KEYCLOAK_ISSUER_URL environment variable is not set");
  }

  return url;
}

export interface AuthenticatedUser {
  userId: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const keycloakUrl = getKeycloakUrl();
    const keycloakIssuerUrl = getKeycloakIssuerUrl();
    const keycloakRealm = getKeycloakRealm();

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`,
      }),
      issuer: `${keycloakIssuerUrl}/realms/${keycloakRealm}`,
      algorithms: ["RS256"],
    });
  }

  validate(payload: {
    sub: string;
    preferred_username: string;
  }): AuthenticatedUser {
    return {
      userId: payload.sub,
      username: payload.preferred_username,
    };
  }
}
