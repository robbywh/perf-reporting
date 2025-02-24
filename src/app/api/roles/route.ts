import { NextResponse } from "next/server";

import { API_KEY } from "@/constants/server";
import { findRoleIdByUserId } from "@/services/users";

export async function GET(request: Request) {
  if (API_KEY !== request.headers.get("x-api-key")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId)
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const roleId = await findRoleIdByUserId(userId);

  if (!roleId)
    return NextResponse.json({ error: "Role ID not found" }, { status: 404 });

  return NextResponse.json({ role: roleId });
}
