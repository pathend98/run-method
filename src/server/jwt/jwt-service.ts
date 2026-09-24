import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTPayload } from "jose";

type JwtConfiguration = {
  jwksUrl: string;
  issuer: string;
  audience: string;
};

export interface JwtService {
  verifyIdToken(token: string, nonce: string): Promise<JWTPayload>;
}

export class DefaultJwtService implements JwtService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly configuration: JwtConfiguration) {
    this.jwks = createRemoteJWKSet(new URL(configuration.jwksUrl));
  }

  async verifyIdToken(token: string, nonce: string): Promise<JWTPayload> {
    if (!nonce) {
      throw new Error("Invalid ID token nonce");
    }

    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.configuration.issuer,
      audience: this.configuration.audience,
      requiredClaims: ["sub", "exp", "iat", "nonce"],
    });

    if (
      payload.nonce !== nonce ||
      (payload.azp !== undefined && payload.azp !== this.configuration.audience)
    ) {
      throw new Error("Invalid ID token claims");
    }

    return payload;
  }
}
