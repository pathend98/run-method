import { readAppEnv } from "./app-env";

afterEach(() => {
  vi.unstubAllEnvs();
});

test.each([
  "http://localhost:3000/",
  "https://app.example.com",
  "https://app.example.com/",
])("preserves the configured app base URL %s", (baseUrl) => {
  vi.stubEnv("APP_BASE_URL", baseUrl);

  expect(readAppEnv()).toEqual({ APP_BASE_URL: baseUrl });
});

test.each([undefined, "", "not a URL", "/", "/training-planner"])(
  "rejects an invalid app base URL: %s",
  (baseUrl) => {
    vi.stubEnv("APP_BASE_URL", baseUrl);

    expect(() => readAppEnv()).toThrow();
  },
);
