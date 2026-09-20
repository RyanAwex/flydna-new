import { NextRequest, NextResponse } from "next/server";

// STUB: Clear chat history for a specific contact
// TODO: When EC2 is ready, forward this request to:
//   DELETE https://staging.flydna.io/api/chat/history/:contactId

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;
    const id = parseInt(contactId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid contactId" }, { status: 400 });
    }

    console.log(`[FlyDnA API] Clear history requested for contact=${id}`);

    // ─── EC2 Migration Point ───────────────────────────────────────────
    const token = req.headers.get("authorization") ?? req.headers.get("auth-token");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
    const ec2Res = await fetch(`${apiBase}/api/chat/history/${id}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: token, "auth-token": token } : {}),
      },
    });
    const body = await ec2Res.json().catch(() => ({ success: ec2Res.ok }));
    return NextResponse.json(body, { status: ec2Res.status });
    // ──────────────────────────────────────────────────────────────────

    return NextResponse.json({ success: true, contactId: id });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
