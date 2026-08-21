import { differenceInCalendarDays } from "date-fns";

import {
  parseDateParam,
  type TrainingSession,
} from "@/domain/training-sessions";
import type { TrainingSessionsRepository } from "./training-sessions-repository";

export class TrainingSessionsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrainingSessionsValidationError";
  }
}

export interface TrainingSessionsService {
  findBetweenDates(
    from: string | null,
    to: string | null,
  ): Promise<TrainingSession[]>;
}

export class DefaultTrainingSessionsService implements TrainingSessionsService {
  constructor(private readonly repository: TrainingSessionsRepository) {}

  async findBetweenDates(
    from: string | null,
    to: string | null,
  ): Promise<TrainingSession[]> {
    if (!from || !to) {
      throw new TrainingSessionsValidationError(
        "from and to query parameters are required",
      );
    }

    const fromDate = parseDateParam(from);
    const toDate = parseDateParam(to);

    if (!fromDate || !toDate) {
      throw new TrainingSessionsValidationError(
        "from and to must be valid dates in YYYY-MM-DD format",
      );
    }

    if (fromDate > toDate) {
      throw new TrainingSessionsValidationError(
        "from must be before or equal to to",
      );
    }

    if (differenceInCalendarDays(toDate, fromDate) > 31) {
      throw new TrainingSessionsValidationError(
        "date range must not exceed 31 days",
      );
    }

    return this.repository.findBetweenDates(from, to);
  }
}
