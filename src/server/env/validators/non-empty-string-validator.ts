import { EnvError, makeValidator } from "envalid";

export const nonEmptyStringValidator = makeValidator<string>((input) => {
  if (input.trim().length === 0) {
    throw new EnvError("OIDC value must not be empty");
  }

  return input;
});
