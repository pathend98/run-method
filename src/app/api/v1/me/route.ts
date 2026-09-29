import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  authenticateUser,
  privateResponseHeaders,
} from "@/app/api/v1/athlete-authorization";
import { BadRequestError } from "@/server/errors/bad-request-error";
import { withApiHandler } from "@/server/http/with-api-handler";
import { getUserService, userProfileRequestValidator } from "@/server/server";

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await authenticateUser(request);
  return NextResponse.json(user, { headers: privateResponseHeaders });
}, "Unable to determine user session");

export const PATCH = withApiHandler(async (request: NextRequest) => {
  const user = await authenticateUser(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON");
  }
  const input = userProfileRequestValidator.validateUpdate(body);
  const updatedUser = await getUserService().updateProfile(user.id, input);
  return NextResponse.json(updatedUser, { headers: privateResponseHeaders });
}, "Unable to update user profile");
