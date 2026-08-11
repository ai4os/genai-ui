import { NextRequest } from "next/server";
import { postMessageStream } from "@/lib/api/chats";
import { ApiError } from "@/lib/api/errors";
import type { MessageTarget } from "@/lib/api/types";
import { apiContent } from "@/content/api";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;
  const { content, model_id, agent_id } = await req.json();

  if ((model_id && agent_id) || (!model_id && !agent_id)) {
    return new Response(
      apiContent.chat.createError,
      { status: 400 },
    );
  }
  const target: MessageTarget = model_id ? { model_id } : { agent_id };

  let upstream: Response;
  try {
    upstream = await postMessageStream(chatId, content, target, req.signal);
  } catch (err) {
    if (err instanceof ApiError) {
      return new Response(err.message, { status: err.status });
    }
    throw err;
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "Upstream error");
    return new Response(detail, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}