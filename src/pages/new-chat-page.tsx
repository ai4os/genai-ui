import { useNavigate, useSearchParams } from "react-router-dom";
import { NewChatView } from "@/features/chat/new-chat-view";
import { useModels, useAgents } from "@/features/chat/api/queries";
import { PageLoader } from "@/features/shared/loader";
import { ApiError } from "@/lib/api";
import { feedbackContent } from "@/content/feedback";
import { ErrorState } from "@/features/shared/error-state";
import { Button } from "@/components/ui/button";

export function NewChatPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const models = useModels();
  const agents = useAgents();

  if (models.isPending || agents.isPending) {
    return <PageLoader />;
  }

  if (models.isError || agents.isError) {
    const error = models.error ?? agents.error;
    const notFound = error instanceof ApiError && error.status === 404;

    return (
      <ErrorState
        error={error}
        onRetry={
          notFound
            ? undefined
            : () =>
                [models, agents].forEach((q) => q.isError && void q.refetch())
        }
      >
        {notFound && (
          <Button size="sm" onClick={() => navigate("/chat")}>
            {feedbackContent.newChat}
          </Button>
        )}
      </ErrorState>
    );
  }

  return (
    <NewChatView
      models={models.data}
      agents={agents.data}
      initialModelId={params.get("model") ?? undefined}
      initialAgentId={params.get("agent") ?? undefined}
    />
  );
}
