import { EnvError, makeValidator } from "envalid";

export const httpUrlValidator = makeValidator<string>((input) => {
  let parsed: URL;

  try {
    parsed = new URL(input);
  } catch {
    throw new EnvError("OIDC URL must be a valid absolute URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new EnvError("OIDC URL must use the http:// or https:// protocol");
  }

  return input;
});
