import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { BadRequestError } from "@/server/errors/bad-request-error";
import { getTrainingSessionsService } from "@/server/server";

type RouteContext = {
  params: Promise<{ athleteId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { athleteId } = await context.params;
    const { searchParams } = request.nextUrl;
    const sessions = await getTrainingSessionsService().find({
      athleteId,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Unable to fetch training sessions" },
      { status: 500 },
    );
  }
}
