import {
  userSchema,
  type UpdateUserProfile,
  type User,
} from "@/domain/user-types";
import { UserApiError } from "./errors/user-api-error";

export async function fetchCurrentUser(): Promise<User> {
  const response = await fetch("/api/v1/me", { cache: "no-store" });
  return readUserResponse(response, "Unable to fetch current user");
}

export async function updateCurrentUser(
  input: UpdateUserProfile,
): Promise<User> {
  const response = await fetch("/api/v1/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return readUserResponse(response, "Unable to update user profile");
}

async function readUserResponse(
  response: Response,
  failureMessage: string,
): Promise<User> {
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : failureMessage;

    throw new UserApiError(message, response.status);
  }

  return userSchema.parse(await response.json());
}
