import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getTrainingSessionsService } from "@/server/server";
import { BadRequestError } from "@/server/errors/bad-request-error";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sessions = await getTrainingSessionsService().find({
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
