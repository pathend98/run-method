import { z } from "zod";

import type { User } from "@/domain/user-types";

const userSchema = z.object({ id: z.string().min(1) });

export class UserApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "UserApiError";
  }
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await fetch("/api/v1/me", { cache: "no-store" });

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
        : "Unable to fetch current user";

    throw new UserApiError(message, response.status);
  }

  return userSchema.parse(await response.json());
}
