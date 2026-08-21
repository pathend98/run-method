import { NextResponse, type NextRequest } from "next/server";

import { trainingSessionsService } from "@/server/server";
import { TrainingSessionsValidationError } from "@/server/training-sessions/training-sessions-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sessions = await trainingSessionsService.findBetweenDates(
      searchParams.get("from"),
      searchParams.get("to"),
    );

    return NextResponse.json(sessions);
  } catch (error) {
    if (error instanceof TrainingSessionsValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Unable to fetch training sessions" },
      { status: 500 },
    );
  }
}
