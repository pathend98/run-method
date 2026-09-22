import { createHash, randomBytes } from "node:crypto";

import type { OidcEnvironment } from "../env/oidc-env";

interface OidcTransaction {
  codeVerifier: string;
  state: string;
  nonce: string;
}

export interface OidcLogin {
  authorizationUrl: URL;
  transaction: string;
  callbackPath: string;
  secureCookie: boolean;
}

export interface OidcLoginService {
  createLogin(): OidcLogin;
}

export class DefaultOidcLoginService implements OidcLoginService {
  constructor(private readonly environment: OidcEnvironment) {}

  createLogin(): OidcLogin {
    const codeVerifier = this.createRandomValue();
    const state = this.createRandomValue();
    const nonce = this.createRandomValue();
    const codeChallenge = createHash("sha256")
      .update(codeVerifier, "ascii")
      .digest("base64url");
    const authorizationUrl = new URL(this.environment.authorizationUrl);

    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", this.environment.clientId);
    authorizationUrl.searchParams.set(
      "redirect_uri",
      this.environment.callbackUrl,
    );
    authorizationUrl.searchParams.set("scope", this.environment.scopes);
    authorizationUrl.searchParams.set("code_challenge", codeChallenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("nonce", nonce);

    const transaction: OidcTransaction = { codeVerifier, state, nonce };
    const callbackUrl = new URL(this.environment.callbackUrl);

    return {
      authorizationUrl,
      transaction: Buffer.from(JSON.stringify(transaction)).toString(
        "base64url",
      ),
      callbackPath: callbackUrl.pathname,
      secureCookie: callbackUrl.protocol === "https:",
    };
  }

  private createRandomValue(): string {
    return randomBytes(32).toString("base64url");
  }
}
