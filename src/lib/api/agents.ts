import "server-only";
import { auth } from "@/auth";
import { ApiError } from "./errors";
import type { AgentInfo } from "./types";

export async function getAgents(): Promise<AgentInfo[]> {
  const session = await auth();

  if (!session?.accessToken) {
    throw new ApiError(401, "There is no active session");
  }

  const res = await fetch(`${process.env.API_URL}/agents`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `Error retrieving agents: ${res.status}`);
  }

  return res.json();
}