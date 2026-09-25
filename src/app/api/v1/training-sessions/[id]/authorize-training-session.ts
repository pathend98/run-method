import { authorizeAthlete } from "@/app/api/v1/athlete-authorization";
import { getTrainingSessionsService } from "@/server/server";

export async function authorizeTrainingSession(
  actorId: string,
  id: string,
): Promise<void> {
  const session = await getTrainingSessionsService().findById(id);
  authorizeAthlete(actorId, session.athleteId);
}
