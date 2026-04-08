import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { AuthUserResponse } from "@/types/user";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const response: AuthUserResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    coupleId: user.coupleId,
    userMode: (user.userMode ?? "solo") as AuthUserResponse["userMode"],
    onboardedAt: user.onboardedAt ? user.onboardedAt.toISOString() : null,
  };

  return NextResponse.json({ user: response });
}
