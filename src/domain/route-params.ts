import { z } from "zod";

export const idRouteParamsSchema = z.object({ id: z.uuid() });
export const athleteRouteParamsSchema = z.object({ athleteId: z.uuid() });
