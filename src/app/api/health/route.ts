import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // DB connectivity check
    await prisma.$queryRawUnsafe("SELECT 1");

    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: {
        database: "connected",
        anthropic_key: process.env.ANTHROPIC_API_KEY ? "configured" : "missing",
      },
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        checks: {
          database: error instanceof Error ? error.message : "disconnected",
        },
      },
      { status: 503 }
    );
  }
}
