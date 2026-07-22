export type SSEEvent<T = unknown> = { event: string; data: T };

export async function* parseSSEStream<T = unknown>(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SSEEvent<T>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      let event = "message";
      let data = "";
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (data) {
        yield { event, data: JSON.parse(data) as T };
      }
    }
  }
}