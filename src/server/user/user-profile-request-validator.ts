import {
  updateUserProfileSchema,
  type UpdateUserProfile,
} from "@/domain/user-types";
import { BadRequestError } from "@/server/errors/bad-request-error";

export interface UserProfileRequestValidator {
  validateUpdate(body: unknown): UpdateUserProfile;
}

export class DefaultUserProfileRequestValidator implements UserProfileRequestValidator {
  validateUpdate(body: unknown): UpdateUserProfile {
    const result = updateUserProfileSchema.safeParse(body);
    if (!result.success) throw new BadRequestError("Invalid user profile");
    return result.data;
  }
}
