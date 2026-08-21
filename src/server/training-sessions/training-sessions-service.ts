import { differenceInCalendarDays } from "date-fns";

import { parseDateFromString } from "@/core/date/date-parsing";
import type { TrainingSession } from "@/domain/training-sessions";
import { TrainingSessionsValidationError } from "./training-sessions-errors";
import type { TrainingSessionsRepository } from "./training-sessions-repository";

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

    const fromDate = parseDateFromString(from);
    const toDate = parseDateFromString(to);

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
