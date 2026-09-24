import { decodeJwt } from "jose";
import type { JWTPayload } from "jose";

export interface JwtService {
  /** Returns unverified claims; this does not authenticate the token. */
  decodeJwt(token: string): JWTPayload;
}

export class DefaultJwtService implements JwtService {
  decodeJwt(token: string): JWTPayload {
    return decodeJwt(token);
  }
}
