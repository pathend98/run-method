import { createHash, randomBytes } from "node:crypto";

import type { JwtService } from "../jwt/jwt-service";
import {
  AuthenticationCallbackError,
  AuthenticationIdTokenVerificationError,
  AuthenticationTokenExchangeError,
} from "./authentication-errors";

type AuthenticationConfiguration = {
  authorizationEndpoint: string;
  callbackUrl: string;
  clientId: string;
  tokenEndpoint: string;
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

type AuthorizationCodeExchange = {
  code: string;
  state: string;
  transactionCookieValue: string;
};

type OidcTokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
};

export type AuthenticatedIdentity = {
  issuer: string;
  subject: string;
  email: string;
  accessToken: string;
  refreshToken: string;
};

export interface AuthenticationService {
  createAuthorizationRedirect(): AuthorizationRedirect;
  exchangeAuthorizationCode(
    exchange: AuthorizationCodeExchange,
  ): Promise<AuthenticatedIdentity>;
}

export class DefaultAuthenticationService implements AuthenticationService {
  constructor(
    private readonly configuration: AuthenticationConfiguration,
    private readonly jwtService: JwtService,
  ) {}

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

  async exchangeAuthorizationCode(
    exchange: AuthorizationCodeExchange,
  ): Promise<AuthenticatedIdentity> {
    const transaction = this.decodeTransaction(exchange.transactionCookieValue);

    if (
      !exchange.code ||
      !exchange.state ||
      exchange.state !== transaction.state
    ) {
      throw new AuthenticationCallbackError("Invalid authorization callback");
    }

    const tokenResponse = await this.fetchTokens(
      exchange.code,
      transaction.codeVerifier,
    );
    const tokens = this.readTokens(tokenResponse);

    try {
      const claims = await this.jwtService.verifyIdToken(
        tokens.idToken,
        transaction.nonce,
      );
      if (
        !this.isNonEmptyString(claims.iss) ||
        !this.isNonEmptyString(claims.sub) ||
        !this.isNonEmptyString(claims.email) ||
        !claims.email.trim()
      ) {
        throw new AuthenticationIdTokenVerificationError();
      }

      return {
        issuer: claims.iss,
        subject: claims.sub,
        email: claims.email.trim(),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch {
      throw new AuthenticationIdTokenVerificationError();
    }
  }

  private async fetchTokens(
    code: string,
    codeVerifier: string,
  ): Promise<unknown> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.configuration.clientId,
      redirect_uri: this.configuration.callbackUrl,
      code,
      code_verifier: codeVerifier,
    });

    let response: Response;
    try {
      response = await fetch(this.configuration.tokenEndpoint, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
        cache: "no-store",
      });
    } catch {
      throw new AuthenticationTokenExchangeError();
    }

    if (!response.ok) {
      throw new AuthenticationTokenExchangeError();
    }

    try {
      return await response.json();
    } catch {
      throw new AuthenticationTokenExchangeError();
    }
  }

  private decodeTransaction(value: string): OidcTransaction {
    let transaction: unknown;
    try {
      transaction = JSON.parse(
        Buffer.from(value, "base64url").toString("utf8"),
      );
    } catch {
      throw new AuthenticationCallbackError(
        "Invalid authorization transaction",
      );
    }

    if (
      !this.isRecord(transaction) ||
      !this.isNonEmptyString(transaction.codeVerifier) ||
      !this.isNonEmptyString(transaction.state) ||
      !this.isNonEmptyString(transaction.nonce)
    ) {
      throw new AuthenticationCallbackError(
        "Invalid authorization transaction",
      );
    }

    return {
      codeVerifier: transaction.codeVerifier,
      state: transaction.state,
      nonce: transaction.nonce,
    };
  }

  private readTokens(value: unknown): OidcTokens {
    if (
      !this.isRecord(value) ||
      !this.isNonEmptyString(value.access_token) ||
      !this.isNonEmptyString(value.id_token) ||
      !this.isNonEmptyString(value.refresh_token)
    ) {
      throw new AuthenticationTokenExchangeError();
    }

    return {
      accessToken: value.access_token,
      idToken: value.id_token,
      refreshToken: value.refresh_token,
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.length > 0;
  }

  private randomValue(): string {
    return randomBytes(32).toString("base64url");
  }
}
