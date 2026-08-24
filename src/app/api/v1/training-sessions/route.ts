import { NextResponse, type NextRequest } from "next/server";

import { trainingSessionsService } from "@/server/server";
import { BadRequestError } from "@/server/errors/server-errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sessions = await trainingSessionsService.findBetweenDates(
      searchParams.get("from"),
      searchParams.get("to"),
    );

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
