import {
  CognitoLogoutProvider,
  KeycloakLogoutProvider,
  type LogoutProvider,
} from "./logout-provider";

const configuration = {
  endpoint: "https://identity.example.com/logout?locale=en",
  callbackUrl: "https://app.example.com/?value=a&next=b",
  clientId: "client + id",
};

test("Keycloak encodes the ID token and callback without leaking parameters between calls", () => {
  const strategy = new KeycloakLogoutProvider(configuration);
  const url = new URL(strategy.createLogoutUrl("token+/=&").href);
  expect(Object.fromEntries(url.searchParams)).toEqual({
    locale: "en",
    post_logout_redirect_uri: configuration.callbackUrl,
    id_token_hint: "token+/=&",
  });
  expect(strategy.createLogoutUrl().searchParams.has("id_token_hint")).toBe(
    false,
  );
});

test.each([undefined, ""])(
  "Keycloak falls back to the client ID for token %s",
  (token) => {
    const url = new KeycloakLogoutProvider(configuration).createLogoutUrl(
      token,
    );
    expect(Object.fromEntries(new URL(url.href).searchParams)).toEqual({
      locale: "en",
      post_logout_redirect_uri: configuration.callbackUrl,
      client_id: configuration.clientId,
    });
  },
);

test.each([undefined, "ignored-token"])(
  "Cognito uses only its client ID and callback for token %s",
  (token) => {
    const strategy: LogoutProvider = new CognitoLogoutProvider(configuration);
    const url = new URL(strategy.createLogoutUrl(token).href);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      locale: "en",
      client_id: configuration.clientId,
      logout_uri: configuration.callbackUrl,
    });
  },
);
