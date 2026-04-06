import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, password 필수" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "비밀번호는 6자 이상" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 이메일" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, coupleId: true, createdAt: true },
  });

  const token = await createSession(user.id);
  const res = NextResponse.json({ user }, { status: 201 });
  res.cookies.set(setSessionCookie(token));
  return res;
}
