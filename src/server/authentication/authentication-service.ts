import { createHash, randomBytes } from "node:crypto";

export const OIDC_TRANSACTION_COOKIE_NAME = "__Host-oidc-transaction";

type AuthenticationConfiguration = {
  authorizationEndpoint: string;
  callbackUrl: string;
  clientId: string;
};

type AuthorizationRedirect = {
  authorizationUrl: URL;
  transactionCookieValue: string;
};

type OidcTransaction = {
  codeVerifier: string;
  state: string;
  nonce: string;
};

export interface AuthenticationService {
  createAuthorizationRedirect(): AuthorizationRedirect;
}

export class DefaultAuthenticationService implements AuthenticationService {
  constructor(private readonly configuration: AuthenticationConfiguration) {}

  createAuthorizationRedirect(): AuthorizationRedirect {
    const transaction: OidcTransaction = {
      codeVerifier: this.randomValue(),
      state: this.randomValue(),
      nonce: this.randomValue(),
    };
    const authorizationUrl = new URL(this.configuration.authorizationEndpoint);

    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", this.configuration.clientId);
    authorizationUrl.searchParams.set(
      "redirect_uri",
      this.configuration.callbackUrl,
    );
    authorizationUrl.searchParams.set("scope", "openid email profile");
    authorizationUrl.searchParams.set("state", transaction.state);
    authorizationUrl.searchParams.set("nonce", transaction.nonce);
    authorizationUrl.searchParams.set(
      "code_challenge",
      createHash("sha256").update(transaction.codeVerifier).digest("base64url"),
    );
    authorizationUrl.searchParams.set("code_challenge_method", "S256");

    return {
      authorizationUrl,
      transactionCookieValue: Buffer.from(JSON.stringify(transaction)).toString(
        "base64url",
      ),
    };
  }

  private randomValue(): string {
    return randomBytes(32).toString("base64url");
  }
}
