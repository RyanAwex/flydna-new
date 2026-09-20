import { NextRequest, NextResponse } from "next/server";

const EC2_BASE = process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";

// Proxies to: PUT /api/contacts/:contactId/update { muted: boolean }
export async function PATCH(req: NextRequest) {
  try {
    const { contactId, muted } = await req.json();

    if (typeof contactId !== "number" || typeof muted !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const token = req.headers.get("authorization") ?? req.headers.get("auth-token");

    const ec2Res = await fetch(`${EC2_BASE}/api/contacts/${contactId}/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token, "auth-token": token } : {}),
      },
      body: JSON.stringify({ muted }),
    });

    const body = await ec2Res.json().catch(() => ({ success: ec2Res.ok }));
    return NextResponse.json(body, { status: ec2Res.status });
  } catch (err) {
    console.error("[FlyDnA] /api/chat/mute error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
