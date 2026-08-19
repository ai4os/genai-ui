import "server-only";
import { auth } from "@/auth";
import { ApiError } from "./errors";
import type { ModelInfo } from "./types";

export async function getModels(): Promise<ModelInfo[]> {
  const session = await auth();

  if (!session?.accessToken) {
    throw new ApiError(401, "There is no active session");
  }

  const res = await fetch(`${process.env.API_URL}/models`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `Error retrieving models: ${res.status}`);
  }
  
  return res.json();
}