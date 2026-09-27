export interface LogoutProvider {
  createLogoutUrl(idToken?: string): URL;
}

export type LogoutConfiguration = {
  endpoint: string;
  callbackUrl: string;
  clientId: string;
};

abstract class AbstractLogoutProvider implements LogoutProvider {
  constructor(protected readonly configuration: LogoutConfiguration) {}

  abstract createLogoutUrl(idToken?: string): URL;
}

export class KeycloakLogoutProvider extends AbstractLogoutProvider {
  createLogoutUrl(idToken?: string): URL {
    const url = new URL(this.configuration.endpoint);
    url.searchParams.set(
      "post_logout_redirect_uri",
      this.configuration.callbackUrl,
    );
    if (idToken) {
      url.searchParams.set("id_token_hint", idToken);
    } else {
      url.searchParams.set("client_id", this.configuration.clientId);
    }
    return url;
  }
}

export class CognitoLogoutProvider extends AbstractLogoutProvider {
  createLogoutUrl(): URL {
    const url = new URL(this.configuration.endpoint);
    url.searchParams.set("client_id", this.configuration.clientId);
    url.searchParams.set("logout_uri", this.configuration.callbackUrl);
    return url;
  }
}
