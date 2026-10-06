"use client";

import { format, parseISO } from "date-fns";
import { useEffect } from "react";

import type { TrainingSession } from "@/domain/training-sessions";
import type { User } from "@/domain/user-types";
import { Button } from "@/ui/shared/button/button";
import { Modal } from "@/ui/shared/modal/modal";
import {
  formatCompactDuration,
  formatDistance,
} from "@/ui/training-sessions/formatters";
import { useReviewTrainingSessionsQuery } from "./hooks/use-review-training-sessions-query";
import { useCurrentUserQuery } from "@/ui/users/current-user-query";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";
import { useTrainingSessionDialogsStore } from "@/ui/training-sessions/training-session-dialogs";

export function ReviewTrainingSessionsModal() {
  const measurementUnit = useDistanceDisplayUnit();
  const activeModal = useTrainingSessionDialogsStore(
    (state) => state.activeModal,
  );
  const closeModal = useTrainingSessionDialogsStore(
    (state) => state.closeModal,
  );
  const openCompleteTrainingSession = useTrainingSessionDialogsStore(
    (state) => state.openCompleteTrainingSessionFromReview,
  );
  const openSkipTrainingSession = useTrainingSessionDialogsStore(
    (state) => state.openSkipTrainingSessionFromReview,
  );
  const currentUser = useCurrentUserQuery();
  const athleteId = currentUser.data?.id;
  const query = useReviewTrainingSessionsQuery(
    athleteId,
    activeModal?.kind === "review",
  );

  useEffect(() => {
    if (activeModal?.kind === "review" && query.data?.length === 0) {
      closeModal();
    }
  }, [activeModal?.kind, closeModal, query.data?.length]);

  if (
    activeModal?.kind !== "review" ||
    query.isPending ||
    query.isError ||
    !query.data?.length
  ) {
    return null;
  }

  const trainingSessionsByDate = groupTrainingSessionsByDate(query.data);
  const count = query.data.length;

  return (
    <Modal
      dismissLabel="Dismiss training sessions requiring attention"
      closeLabel="Close training sessions requiring attention"
      footerActions={[
        { label: "Close", onClick: closeModal, variant: "tertiary" },
      ]}
      onClose={closeModal}
      title="Training sessions needing attention"
    >
      <p className="mt-2 text-sm text-zinc-600">
        {count} {count === 1 ? "training session" : "training sessions"}{" "}
        remaining.
      </p>
      <div className="mt-5 divide-y divide-zinc-200">
        {trainingSessionsByDate.map(([date, trainingSessions]) => (
          <section
            className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 py-3"
            key={date}
          >
            <h3 className="pt-1 text-xs font-semibold tracking-wide text-zinc-600 uppercase">
              {format(parseISO(date), "EEE d MMM")}
            </h3>
            <ul className="flex min-w-0 flex-col gap-3">
              {trainingSessions.map((trainingSession) => (
                <li
                  className="flex flex-wrap items-start justify-between gap-3"
                  key={trainingSession.id}
                >
                  <div>
                    <p className="font-medium text-zinc-950">
                      {trainingSession.title}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {formatPlannedMetrics(trainingSession, measurementUnit)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        openCompleteTrainingSession(trainingSession)
                      }
                      size="compact"
                      variant="primary"
                    >
                      Complete
                    </Button>
                    <Button
                      onClick={() => openSkipTrainingSession(trainingSession)}
                      size="compact"
                      variant="warning"
                    >
                      Skip
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}

function groupTrainingSessionsByDate(trainingSessions: TrainingSession[]) {
  const grouped = new Map<string, TrainingSession[]>();
  for (const trainingSession of trainingSessions) {
    grouped.set(trainingSession.date, [
      ...(grouped.get(trainingSession.date) ?? []),
      trainingSession,
    ]);
  }
  return [...grouped.entries()];
}

function formatPlannedMetrics(
  trainingSession: TrainingSession,
  measurementUnit: User["measurementUnit"],
) {
  const metrics = [
    ...(trainingSession.activityType === "RUN"
      ? [formatDistance(trainingSession.targetDistanceMetres, measurementUnit)]
      : []),
    formatCompactDuration(trainingSession.targetDurationSeconds),
  ].filter((metric): metric is string => metric !== null);
  return metrics.join(" · ");
}
