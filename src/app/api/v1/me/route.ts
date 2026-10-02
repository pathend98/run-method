import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  apiHandler,
  requestAuthenticationService,
  unmarshaler,
  getUserService,
} from "@/server/server";
import { updateUserProfileSchema } from "@/domain/user-types";
import { privateResponseHeaders } from "@/server/http/api-handler";

export const GET = apiHandler.wrap(async (request: NextRequest) => {
  const user = await requestAuthenticationService.authenticateUser(request);
  return NextResponse.json(user, { headers: privateResponseHeaders });
}, "Unable to determine user session");

export const PATCH = apiHandler.wrap(async (request: NextRequest) => {
  const user = await requestAuthenticationService.authenticateUser(request);

  const input = await unmarshaler.readRequestBody(
    request,
    updateUserProfileSchema,
  );

  const updatedUser = await getUserService().updateProfile(user.id, input);

  return NextResponse.json(updatedUser, { headers: privateResponseHeaders });
}, "Unable to update user profile");
