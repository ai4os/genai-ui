import { NextRequest, NextResponse } from "next/server";
import { addMessage } from "@/lib/api/chats";
import { ApiError } from "@/lib/api/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;
  const { content } = await req.json();

  try {
    const message = await addMessage(chatId, content);
    return NextResponse.json(message);
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}