import { NextResponse } from "next/server";
import { SEED_PROBLEMS, publicProblem } from "@/lib/problems";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    problems: SEED_PROBLEMS.map(publicProblem),
  });
}
